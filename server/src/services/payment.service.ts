import { Request } from "express";
import { PaymentModel, PaymentStatus } from "../models/payment.model";
import { OrderModel } from "../models/order.model";
import { CartModel } from "../models/cart.model";
import { ProductModel } from "../models/product.model";
import { WebhookEventModel } from "../models/webhook-event.model";
import { FailedWebhookModel } from "../models/failed-webhook.model";
import { PaymentProvider } from "./payments/payment.provider";
import { StripeProvider } from "./payments/stripe.provider";
import { PaymentMetricsService } from "./payment-metrics.service";
import { CartService } from "./cart.service";
import { log } from "../utils/logger";

// Register payment providers here - easy to add PayPal, Square, etc.
const providerFactories: Record<string, () => PaymentProvider> = {
  stripe: () => {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        "Stripe selected as provider but STRIPE_SECRET_KEY is missing",
      );
    }
    return new StripeProvider();
  },
  // Add more providers as needed:
  // paypal: () => new PayPalProvider(),
  // square: () => new SquareProvider(),
};

const mapToOrderPaymentStatus = (
  status: PaymentStatus,
): "pending" | "paid" | "failed" | "refunded" => {
  if (status === "succeeded") return "paid";
  if (status === "refunded") return "refunded";
  if (status === "failed" || status === "canceled") return "failed";
  return "pending";
};

export class PaymentService {
  private static getProvider(): PaymentProvider {
    const key = (process.env.PAYMENT_PROVIDER || "stripe").toLowerCase();
    const factory = providerFactories[key];
    if (!factory) {
      throw new Error(`Unsupported payment provider: ${key}`);
    }
    return factory();
  }

  /**
   * Create payment intent for an order
   */
  static async createPaymentIntent(userId: string, orderId: string) {
    const startTime = log.in("PaymentService", "createPaymentIntent", {
      userId,
      orderId,
    });

    const order = await OrderModel.findOne({ _id: orderId, user: userId });

    if (!order) {
      log.err(
        "PaymentService",
        "createPaymentIntent",
        startTime,
        "Order not found",
      );
      throw new Error("Order not found");
    }

    if (order.paymentStatus === "paid") {
      log.err(
        "PaymentService",
        "createPaymentIntent",
        startTime,
        "Order already paid",
      );
      throw new Error("Order already paid");
    }

    // 📊 Record payment attempt
    PaymentMetricsService.recordPaymentAttempt(orderId, order.totalAmount);

    const provider = this.getProvider();
    const currency = process.env.PAYMENT_CURRENCY || "ILS";

    const intent = await provider.createPaymentIntent({
      orderId,
      orderNumber: order.orderNumber,
      userId,
      amount: order.totalAmount,
      currency,
      metadata: { orderId, userId },
    });

    const payment = await PaymentModel.create({
      order: orderId,
      user: userId,
      amount: order.totalAmount,
      currency,
      status: intent.status,
      provider: provider.name,
      providerPaymentId: intent.providerPaymentId, // Checkout session ID (cs_test_...)
      paymentIntentId: intent.raw?.payment_intent, // Real payment_intent ID (pi_...) if available
      clientSecret: intent.clientSecret,
      checkoutUrl: intent.checkoutUrl,
      meta: intent.raw,
    });

    order.paymentStatus = mapToOrderPaymentStatus(intent.status);
    order.status = "pending_payment";
    order.paymentIntentId = intent.providerPaymentId; // Session ID for now
    // paymentIntentStripeId will be set when webhook arrives with pi_ ID
    await order.save();

    log.out("PaymentService", "createPaymentIntent", startTime, {
      paymentId: payment._id,
      status: intent.status,
    });

    return {
      payment,
      status: intent.status,
      clientSecret: intent.clientSecret,
      checkoutUrl: intent.checkoutUrl,
    };
  }

  /**
   * Get latest payment status for an order
   */
  static async getPaymentStatus(userId: string, orderId: string) {
    const order = await OrderModel.findOne({ _id: orderId, user: userId });

    if (!order) {
      throw new Error("Order not found");
    }

    const payment = await PaymentModel.findOne({ order: orderId, user: userId })
      .sort({ createdAt: -1 })
      .lean();

    return {
      orderPaymentStatus: order.paymentStatus,
      paymentStatus: payment?.status || "pending",
      paymentId: payment?._id,
      providerPaymentId: payment?.providerPaymentId,
      checkoutUrl: payment?.checkoutUrl,
      clientSecret: payment?.clientSecret,
    };
  }

  /**
   * Handle provider webhook with signature verification and idempotency
   */
  static async handleWebhook(req: Request) {
    const webhookStartTime = Date.now();
    const startTime = log.in("PaymentService", "handleWebhook");

    const provider = this.getProvider();

    // Note: req.body is still a Buffer at this point because of express.raw()
    // We'll log eventType after the provider parses the webhook
    const result = await provider.handleWebhook(req);

    // ✅ Now we can safely log the event type from the parsed result
    log.info("📨 Webhook received", {
      service: "PaymentService",
      eventType: result.eventType || "unknown",
    });

    // ⏭️ Skip processing unhandled event types (informational events we don't need)
    if (result.providerPaymentId === "skipped") {
      log.info("⏭️ Skipping unhandled webhook event type", {
        service: "PaymentService",
        eventType: result.eventType || "unknown",
      });
      return {
        eventType: result.eventType || "unknown",
        status: "skipped",
      };
    }

    log.info("🔍 Processing webhook event", {
      service: "PaymentService",
      eventType: result.eventType || "unknown",
      providerPaymentId: result.providerPaymentId,
      providerPaymentIntentId: result.providerPaymentIntentId,
      orderId: result.orderId,
    });

    // ✅ Check if event was already processed (idempotency)
    const existingEvent = await WebhookEventModel.findOne({
      eventId: result.providerPaymentId,
      provider: provider.name,
    });

    if (existingEvent) {
      log.warn("⚠️ Webhook event already processed (idempotency)", {
        service: "PaymentService",
        eventId: result.providerPaymentId,
        processedAt: existingEvent.processedAt,
      });
      throw new Error(
        `Webhook event ${result.providerPaymentId} already processed`,
      );
    }

    // 🔍 Find payment by provider payment ID (or payment intent ID for Stripe)
    let payment = await PaymentModel.findOne({
      providerPaymentId: result.providerPaymentId,
    });

    if (payment) {
      log.info("✅ Payment found by providerPaymentId", {
        service: "PaymentService",
        providerPaymentId: result.providerPaymentId,
        paymentId: payment._id,
      });
    }

    // 🔍 If not found and we have a payment intent ID (from Stripe webhooks), try that
    if (!payment && result.providerPaymentIntentId) {
      log.info("🔍 Payment not found by session ID, trying payment_intent ID", {
        service: "PaymentService",
        paymentIntentId: result.providerPaymentIntentId,
      });

      payment = await PaymentModel.findOne({
        $or: [
          { paymentIntentId: result.providerPaymentIntentId },
          { "meta.payment_intent": result.providerPaymentIntentId },
        ],
      });

      if (payment) {
        log.info("✅ Payment found by payment_intent ID", {
          service: "PaymentService",
          paymentIntentId: result.providerPaymentIntentId,
          paymentId: payment._id,
        });
      }
    }

    // 🔍 Fallback: use orderId from webhook metadata (Stripe metadata.orderId)
    if (!payment && result.orderId) {
      log.info("🔍 Payment not found by IDs, trying orderId fallback", {
        service: "PaymentService",
        orderId: result.orderId,
      });

      payment = await PaymentModel.findOne({ order: result.orderId })
        .sort({ createdAt: -1 })
        .exec();

      if (payment) {
        log.info("✅ Payment found by orderId", {
          service: "PaymentService",
          orderId: result.orderId,
          paymentId: payment._id,
        });
      }
    }

    if (!payment) {
      log.error(
        "❌ Payment not found for webhook - all lookup methods failed",
        {
          service: "PaymentService",
          providerPaymentId: result.providerPaymentId,
          providerPaymentIntentId: result.providerPaymentIntentId,
          orderId: result.orderId,
        },
      );
      throw new Error(
        `Payment not found for provider ID: ${result.providerPaymentId}`,
      );
    }

    // 🧷 Backfill payment_intent into both meta and paymentIntentId field (ensures lookups work)
    if (result.providerPaymentIntentId && !payment.paymentIntentId) {
      payment.paymentIntentId = result.providerPaymentIntentId;
    }

    if (
      result.providerPaymentIntentId &&
      (!payment.meta || !payment.meta.payment_intent)
    ) {
      payment.meta = {
        ...(payment.meta || {}),
        payment_intent: result.providerPaymentIntentId,
      };
    }

    // 💾 Update payment status
    payment.status = result.status;
    payment.meta = result.raw || payment.meta;
    await payment.save();

    // 📝 Update order status
    const order = await OrderModel.findById(payment.order);
    if (order) {
      // 🔒 CRITICAL SECURITY: Verify payment amount matches order total
      // Prevents malicious webhooks from claiming lower payment amounts
      const expectedAmountInCents = Math.round(order.totalAmount * 100);
      const receivedAmountInCents = result.amount || 0;
      
      if (receivedAmountInCents !== expectedAmountInCents) {
        log.error("❌ Payment amount mismatch - possible fraud attempt", {
          service: "PaymentService",
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          expectedAmount: expectedAmountInCents,
          receivedAmount: receivedAmountInCents,
          difference: Math.abs(expectedAmountInCents - receivedAmountInCents),
        });
        
        // Mark payment as failed due to amount mismatch
        payment.status = "failed";
        await payment.save();
        
        order.paymentStatus = "failed";
        await order.save();
        
        throw new Error(
          `Payment amount mismatch: expected ${expectedAmountInCents} cents, received ${receivedAmountInCents} cents`,
        );
      }
      
      log.info("✅ Payment amount verified", {
        service: "PaymentService",
        orderId: order._id.toString(),
        amount: expectedAmountInCents,
      });
      const oldPaymentStatus = order.paymentStatus;
      const newMappedStatus = mapToOrderPaymentStatus(result.status);

      // ✅ Don't downgrade status if already paid/fulfilled
      // Stripe sends payment_intent.succeeded BEFORE checkout.session.completed
      // We don't want checkout.session.completed (pending) to overwrite paid status
      if (order.fulfilled || oldPaymentStatus === "paid") {
        // Already fulfilled or paid - don't downgrade
        log.info("⚠️ Order already fulfilled/paid - not updating status", {
          orderId: order._id,
          oldStatus: oldPaymentStatus,
          wouldBe: newMappedStatus,
          fulfilled: order.fulfilled,
        });
      } else {
        order.paymentStatus = newMappedStatus;
      }

      log.info("💳 Payment status updated", {
        orderId: order._id,
        oldStatus: oldPaymentStatus,
        newStatus: order.paymentStatus,
        webhookStatus: result.status,
        fulfilled: order.fulfilled,
      });

      // ✅ Store real payment_intent ID if available
      if (result.providerPaymentIntentId) {
        order.paymentIntentStripeId = result.providerPaymentIntentId;
      }

      // ✅ If payment succeeded, confirm order and process fulfillment
      if (
        result.status === "succeeded" &&
        oldPaymentStatus !== "paid" &&
        !order.fulfilled
      ) {
        log.info("✅ Fulfillment conditions met - processing order", {
          orderId: order._id,
          condition1: `result.status === "succeeded" → ${result.status === "succeeded"}`,
          condition2: `oldPaymentStatus !== "paid" → ${String(oldPaymentStatus) !== "paid"}`,
          condition3: `!order.fulfilled → ${!order.fulfilled}`,
        });

        order.status = "confirmed";
        order.paymentVerifiedAt = new Date();
        await order.save();

        log.info(
          "📦 Starting order fulfillment (stock reduction + cart clear)",
          {
            service: "PaymentService",
            orderId: order._id,
            orderNumber: order.orderNumber,
            itemCount: order.items.length,
            status: `Moving from ${oldPaymentStatus} to paid`,
          },
        );

        // 🔄 Use MongoDB transaction for atomic stock reduction
        const mongoose = await import("mongoose");
        const session = await mongoose.default.startSession();
        session.startTransaction();

        try {
          let totalStockReduced = 0;

          // 📦 Reduce stock atomically
          for (const item of order.items) {
            log.info("Reducing stock", {
              productId: item.product,
              quantity: item.quantity,
            });

            const product = await ProductModel.findByIdAndUpdate(
              item.product,
              { $inc: { stock: -item.quantity } },
              { new: true, session },
            );

            if (!product) {
              throw new Error(`Product ${item.product} not found`);
            }

            if (product.stock < 0) {
              throw new Error(
                `Insufficient stock for ${item.name}: needed ${item.quantity}, had ${product.stock + item.quantity}`,
              );
            }

            totalStockReduced += item.quantity;
            log.info("✅ Stock reduced", {
              productId: item.product,
              productName: item.name,
              newStock: product.stock,
            });
          }

          // 🧹 Clear cart (Redis + MongoDB)
          await CartService.clearCart(order.user.toString());

          // ✅ Mark order as fulfilled
          order.fulfilled = true;
          order.fulfilledAt = new Date();
          await order.save({ session });

          // 📊 Commit transaction
          await session.commitTransaction();

          log.info("✅ Order fulfillment successful - transaction committed", {
            service: "PaymentService",
            orderId: order._id,
            orderNumber: order.orderNumber,
            amount: order.totalAmount,
            totalStockReduced,
          });

          // 📊 Record successful payment metrics
          const duration = Date.now() - webhookStartTime;
          PaymentMetricsService.recordPaymentSuccess(
            order._id.toString(),
            order.totalAmount,
            duration,
          );
        } catch (fulfillmentError: any) {
          // 🔄 Transaction auto-aborts on error
          await session.abortTransaction().catch(() => undefined);

          const txnUnsupported =
            fulfillmentError?.message &&
            fulfillmentError.message.includes(
              "Transaction numbers are only allowed on a replica set member or mongos",
            );

          if (txnUnsupported) {
            log.warn(
              "⚠️ MongoDB transactions unsupported (standalone). Falling back to non-transactional fulfillment.",
              {
                service: "PaymentService",
                orderId: order._id,
                orderNumber: order.orderNumber,
              },
            );

            try {
              let totalStockReduced = 0;

              for (const item of order.items) {
                const product = await ProductModel.findByIdAndUpdate(
                  item.product,
                  { $inc: { stock: -item.quantity } },
                  { new: true },
                );

                if (!product) {
                  throw new Error(`Product ${item.product} not found`);
                }

                if (product.stock < 0) {
                  throw new Error(
                    `Insufficient stock for ${item.name}: needed ${item.quantity}, had ${product.stock + item.quantity}`,
                  );
                }

                totalStockReduced += item.quantity;
              }

              // 🧹 Clear cart (Redis + MongoDB)
              await CartService.clearCart(order.user.toString());

              order.fulfilled = true;
              order.fulfilledAt = new Date();
              await order.save();

              log.info(
                "✅ Order fulfillment successful - non-transactional fallback",
                {
                  service: "PaymentService",
                  orderId: order._id,
                  orderNumber: order.orderNumber,
                  amount: order.totalAmount,
                  totalStockReduced,
                },
              );

              const duration = Date.now() - webhookStartTime;
              PaymentMetricsService.recordPaymentSuccess(
                order._id.toString(),
                order.totalAmount,
                duration,
              );

              return {
                status: result.status,
                orderId: order._id.toString(),
              };
            } catch (fallbackError: any) {
              log.error("❌ Fallback fulfillment failed", {
                service: "PaymentService",
                orderId: order._id,
                error: fallbackError.message,
              });

              order.status = "pending";
              order.notes = `Fulfillment failed (no transactions): ${fallbackError.message}`;
              await order.save();

              throw fallbackError;
            }
          }

          log.error(
            "❌ Order fulfillment failed - transaction aborted, stock NOT reduced",
            {
              service: "PaymentService",
              orderId: order._id,
              error: fulfillmentError.message,
            },
          );

          // ⚠️ Mark order as needing manual review
          order.status = "pending";
          order.notes = `Fulfillment failed: ${fulfillmentError.message}. Payment succeeded but stock/cart not updated due to transaction rollback.`;
          await order.save();

          throw fulfillmentError;
        } finally {
          await session.endSession();
        }
      } else if (result.status === "failed") {
        order.status = "cancelled";
        await order.save();

        // 📊 Record failed payment metrics
        PaymentMetricsService.recordPaymentFailure(
          order._id.toString(),
          order.totalAmount,
          "Payment intent failed",
        );

        log.warn("❌ Payment failed, order cancelled", {
          service: "PaymentService",
          orderId: order._id,
        });
      } else {
        log.info("ℹ️ Webhook received but fulfillment not triggered", {
          orderId: order._id,
          reason: `Conditions not met: status=${result.status}, oldStatus=${oldPaymentStatus}, fulfilled=${order.fulfilled}`,
        });
        await order.save();
      }
    }

    // ✅ Record webhook event as processed
    await WebhookEventModel.create({
      eventId: result.providerPaymentId,
      eventType: result.status,
      provider: provider.name,
      metadata: result.raw,
    });

    // 📊 Record webhook processing metrics
    const webhookDuration = Date.now() - webhookStartTime;
    PaymentMetricsService.recordWebhookDuration(
      result.providerPaymentId,
      webhookDuration,
    );

    log.out("PaymentService", "handleWebhook", startTime, {
      status: result.status,
      orderId: order?._id,
    });

    return { ok: true, eventType: result.status };
  }

  /**
   * Confirm payment - called by webhook when Stripe confirms payment
   * ✅ This is the CRITICAL method that updates order status!
   */
  static async confirmPayment(paymentIntentId: string) {
    // 1. Find order by payment intent ID
    const order = await OrderModel.findOne({ paymentIntentId });
    if (!order) {
      throw new Error("Order not found for this payment");
    }

    // 2. ✅ Update order status to "confirmed"
    order.paymentStatus = "paid";
    order.status = "confirmed";
    order.paymentVerifiedAt = new Date();
    await order.save();

    // 3. 🔴 NOW reduce stock (only after payment confirmed!)
    for (const item of order.items) {
      const product = await ProductModel.findById(item.product);
      if (product) {
        product.stock -= item.quantity;
        await product.save();
      }
    }

    // 4. 🧹 NOW clear the cart
    await CartModel.findOneAndUpdate(
      { userId: order.user },
      { items: [], total: 0 },
    );

    // 5. Update payment record
    const payment = await PaymentModel.findOneAndUpdate(
      { order: order._id },
      { status: "succeeded" },
      { new: true },
    );

    return { order, payment };
  }
}
