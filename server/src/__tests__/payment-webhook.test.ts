import request from "supertest";
import Stripe from "stripe";
import app from "../app";
import { PaymentModel } from "../models/payment.model";
import { OrderModel } from "../models/order.model";
import { WebhookEventModel } from "../models/webhook-event.model";

// Note: Database connection is handled by app.ts
// Tests will use the same MongoDB instance as the application

// Mock Stripe SDK
jest.mock("stripe");

/**
 * Payment Webhook Test Suite
 *
 * Tests webhook signature validation, idempotency, and replay attack prevention
 * Critical for production security - ensures only authentic Stripe events are processed
 */
describe("Payment Webhook Security", () => {
  let testOrderId: string;
  let testPaymentId: string;

  beforeEach(async () => {
    // Clean up test data
    await PaymentModel.deleteMany({});
    await OrderModel.deleteMany({});
    await WebhookEventModel.deleteMany({});

    // Create test order
    const order = await OrderModel.create({
      orderNumber: "TEST-001",
      user: "507f1f77bcf86cd799439011",
      items: [
        {
          product: "507f1f77bcf86cd799439012",
          name: "Test Product",
          price: 100,
          quantity: 2,
        },
      ],
      totalAmount: 200,
      status: "pending_payment",
      paymentStatus: "pending",
      paymentMethod: "stripe",
      shippingAddress: {
        street: "123 Test St",
        city: "Test City",
        postalCode: "12345",
        country: "IL",
      },
    });
    testOrderId = order._id.toString();

    // Create test payment
    const payment = await PaymentModel.create({
      order: testOrderId,
      user: "507f1f77bcf86cd799439011",
      amount: 200,
      currency: "ILS",
      status: "pending",
      provider: "stripe",
      providerPaymentId: "pi_test_123",
    });
    testPaymentId = payment._id.toString();
  });

  describe("Webhook Signature Verification", () => {
    it("should reject webhook with invalid signature", async () => {
      const webhookPayload = JSON.stringify({
        id: "evt_test_webhook",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test_123",
            amount: 20000, // 200.00 ILS in cents
            status: "succeeded",
          },
        },
      });

      // Mock Stripe signature verification to throw error
      const mockConstructEvent = jest.fn(() => {
        throw new Error(
          "No signatures found matching the expected signature for payload",
        );
      });
      (Stripe as any).prototype.webhooks = {
        constructEvent: mockConstructEvent,
      };

      const response = await request(app)
        .post("/api/payments/webhook")
        .set("stripe-signature", "invalid_signature")
        .send(webhookPayload)
        .expect(400);

      expect(response.body.error).toContain("signature verification failed");
      expect(mockConstructEvent).toHaveBeenCalled();

      // Verify event was NOT processed
      const order = await OrderModel.findById(testOrderId);
      expect(order?.paymentStatus).toBe("pending");
    });

    it("should accept webhook with valid signature", async () => {
      const webhookEvent = {
        id: "evt_test_webhook_valid",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test_123",
            amount: 20000,
            status: "succeeded",
            metadata: {
              orderId: testOrderId,
            },
          },
        },
      };

      // Mock Stripe signature verification to succeed
      const mockConstructEvent = jest.fn(() => webhookEvent);
      (Stripe as any).prototype.webhooks = {
        constructEvent: mockConstructEvent,
      };

      const response = await request(app)
        .post("/api/payments/webhook")
        .set("stripe-signature", "valid_signature_here")
        .send(JSON.stringify(webhookEvent))
        .expect(200);

      expect(mockConstructEvent).toHaveBeenCalled();
      expect(response.body.received).toBe(true);
    });

    it("should reject webhook with missing signature header", async () => {
      const webhookPayload = JSON.stringify({
        id: "evt_test_no_sig",
        type: "payment_intent.succeeded",
      });

      const response = await request(app)
        .post("/api/payments/webhook")
        // Intentionally omit stripe-signature header
        .send(webhookPayload)
        .expect(400);

      expect(response.body.error).toContain("signature");
    });
  });

  describe("Webhook Idempotency", () => {
    it("should process webhook only once (prevent replay attacks)", async () => {
      const webhookEvent = {
        id: "evt_test_idempotency",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test_123",
            amount: 20000,
            status: "succeeded",
            metadata: {
              orderId: testOrderId,
            },
          },
        },
      };

      // Mock Stripe signature verification
      const mockConstructEvent = jest.fn(() => webhookEvent);
      (Stripe as any).prototype.webhooks = {
        constructEvent: mockConstructEvent,
      };

      // First webhook - should process
      const firstResponse = await request(app)
        .post("/api/payments/webhook")
        .set("stripe-signature", "valid_sig")
        .send(JSON.stringify(webhookEvent))
        .expect(200);

      expect(firstResponse.body.received).toBe(true);

      // Verify event was recorded
      const savedEvent = await WebhookEventModel.findOne({
        eventId: "evt_test_idempotency",
      });
      expect(savedEvent).toBeTruthy();
      expect(savedEvent?.processedAt).toBeTruthy();

      // Second webhook with same event ID - should be idempotent (not process again)
      const secondResponse = await request(app)
        .post("/api/payments/webhook")
        .set("stripe-signature", "valid_sig")
        .send(JSON.stringify(webhookEvent))
        .expect(200);

      expect(secondResponse.body).toBeTruthy(); // Event has been processed
      expect(secondResponse.body.received).toBe(true);

      // Verify only one event record exists
      const eventCount = await WebhookEventModel.countDocuments({
        eventId: "evt_test_idempotency",
      });
      expect(eventCount).toBe(1);
    });

    it("should handle different events with same payment ID", async () => {
      const event1 = {
        id: "evt_test_multi_1",
        type: "payment_intent.created",
        data: {
          object: {
            id: "pi_test_123",
            status: "processing",
          },
        },
      };

      const event2 = {
        id: "evt_test_multi_2",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test_123",
            amount: 20000,
            status: "succeeded",
            metadata: {
              orderId: testOrderId,
            },
          },
        },
      };

      const mockConstructEvent = jest
        .fn()
        .mockReturnValueOnce(event1)
        .mockReturnValueOnce(event2);
      (Stripe as any).prototype.webhooks = {
        constructEvent: mockConstructEvent,
      };

      // Process both events
      await request(app)
        .post("/api/payments/webhook")
        .set("stripe-signature", "sig1")
        .send(JSON.stringify(event1))
        .expect(200);

      await request(app)
        .post("/api/payments/webhook")
        .set("stripe-signature", "sig2")
        .send(JSON.stringify(event2))
        .expect(200);

      // Verify both events were recorded separately
      const events = await WebhookEventModel.find({
        eventId: { $in: ["evt_test_multi_1", "evt_test_multi_2"] },
      });
      expect(events).toHaveLength(2);
    });
  });

  describe("Webhook Amount Verification", () => {
    it("should reject webhook if payment amount doesn't match order total", async () => {
      const webhookEvent = {
        id: "evt_test_amount_mismatch",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test_123",
            amount: 10000, // 100.00 ILS - WRONG! Order is 200.00
            status: "succeeded",
            metadata: {
              orderId: testOrderId,
            },
          },
        },
      };

      const mockConstructEvent = jest.fn(() => webhookEvent);
      (Stripe as any).prototype.webhooks = {
        constructEvent: mockConstructEvent,
      };

      const response = await request(app)
        .post("/api/payments/webhook")
        .set("stripe-signature", "valid_sig")
        .send(JSON.stringify(webhookEvent))
        .expect(200); // Webhook endpoint returns 200 but logs error

      // Verify payment was NOT marked as succeeded due to amount mismatch
      const payment = await PaymentModel.findById(testPaymentId);
      expect(payment?.status).not.toBe("succeeded");

      // Verify order was NOT marked as paid
      const order = await OrderModel.findById(testOrderId);
      expect(order?.paymentStatus).toBe("pending");
    });

    it("should accept webhook with correct amount", async () => {
      const webhookEvent = {
        id: "evt_test_amount_correct",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_test_123",
            amount: 20000, // 200.00 ILS - CORRECT
            status: "succeeded",
            metadata: {
              orderId: testOrderId,
            },
          },
        },
      };

      const mockConstructEvent = jest.fn(() => webhookEvent);
      (Stripe as any).prototype.webhooks = {
        constructEvent: mockConstructEvent,
      };

      await request(app)
        .post("/api/payments/webhook")
        .set("stripe-signature", "valid_sig")
        .send(JSON.stringify(webhookEvent))
        .expect(200);

      // Verify payment processed successfully
      const order = await OrderModel.findById(testOrderId);
      expect(order?.paymentStatus).toBe("paid");
    });
  });

  describe("Webhook Event Types", () => {
    it("should handle checkout.session.completed", async () => {
      const webhookEvent = {
        id: "evt_test_checkout_completed",
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_123",
            payment_intent: "pi_test_123",
            amount_total: 20000,
            payment_status: "paid",
            metadata: {
              orderId: testOrderId,
            },
          },
        },
      };

      const mockConstructEvent = jest.fn(() => webhookEvent);
      (Stripe as any).prototype.webhooks = {
        constructEvent: mockConstructEvent,
      };

      await request(app)
        .post("/api/payments/webhook")
        .set("stripe-signature", "valid_sig")
        .send(JSON.stringify(webhookEvent))
        .expect(200);

      const savedEvent = await WebhookEventModel.findOne({
        eventId: "evt_test_checkout_completed",
      });
      expect(savedEvent).toBeTruthy();
    });

    it("should handle payment_intent.payment_failed", async () => {
      const webhookEvent = {
        id: "evt_test_payment_failed",
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_test_123",
            amount: 20000,
            status: "failed",
            metadata: {
              orderId: testOrderId,
            },
          },
        },
      };

      const mockConstructEvent = jest.fn(() => webhookEvent);
      (Stripe as any).prototype.webhooks = {
        constructEvent: mockConstructEvent,
      };

      await request(app)
        .post("/api/payments/webhook")
        .set("stripe-signature", "valid_sig")
        .send(JSON.stringify(webhookEvent))
        .expect(200);

      // Verify payment marked as failed
      const payment = await PaymentModel.findOne({
        providerPaymentId: "pi_test_123",
      });
      expect(payment?.status).toBe("failed");
    });
  });

  describe("Edge Cases", () => {
    it("should handle webhook for non-existent order", async () => {
      const webhookEvent = {
        id: "evt_test_no_order",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_nonexistent",
            amount: 20000,
            status: "succeeded",
            metadata: {
              orderId: "507f1f77bcf86cd799439099", // Doesn't exist
            },
          },
        },
      };

      const mockConstructEvent = jest.fn(() => webhookEvent);
      (Stripe as any).prototype.webhooks = {
        constructEvent: mockConstructEvent,
      };

      const response = await request(app)
        .post("/api/payments/webhook")
        .set("stripe-signature", "valid_sig")
        .send(JSON.stringify(webhookEvent))
        .expect(200); // Should not throw, just log

      // Event should still be recorded as processed
      const savedEvent = await WebhookEventModel.findOne({
        eventId: "evt_test_no_order",
      });
      expect(savedEvent).toBeTruthy();
    });

    it("should handle malformed webhook payload", async () => {
      const response = await request(app)
        .post("/api/payments/webhook")
        .set("stripe-signature", "valid_sig")
        .set("Content-Type", "application/json")
        .send("invalid json {{{")
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });
  });
});
