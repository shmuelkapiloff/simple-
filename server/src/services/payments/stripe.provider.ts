import Stripe from "stripe";
import { PaymentStatus } from "../../models/payment.model";
import {
  CreateIntentParams,
  CreateIntentResult,
  PaymentProvider,
  StatusResult,
} from "./payment.provider";
import { Request } from "express";

/**
 * Stripe Payment Provider
 * To use: Install `npm install stripe` and set STRIPE_SECRET_KEY in .env
 */
export class StripeProvider implements PaymentProvider {
  name = "stripe";
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: "2025-12-15.clover" as any, // Use latest API version
    });
  }

  async createPaymentIntent(
    params: CreateIntentParams,
  ): Promise<CreateIntentResult> {
    // Create Stripe Checkout Session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: params.currency.toLowerCase(),
            product_data: {
              name: `Order ${params.orderNumber}`,
              description: `Payment for order ${params.orderNumber}`,
            },
            unit_amount: Math.round(params.amount * 100), // Convert to cents/agorot
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/checkout?payment=success&orderId=${params.orderId}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout?payment=cancelled&orderId=${params.orderId}`,
      client_reference_id: params.orderId,
      metadata: {
        orderId: params.orderId,
        userId: params.userId,
        orderNumber: params.orderNumber,
      },
      // Ensure Payment Intent also carries the order metadata for PI webhooks
      payment_intent_data: {
        metadata: {
          orderId: params.orderId,
          userId: params.userId,
          orderNumber: params.orderNumber,
        },
      },
    });

    // Map Stripe status to our PaymentStatus
    const status: PaymentStatus =
      session.payment_status === "paid" ? "succeeded" : "pending";

    return {
      providerPaymentId: session.id,
      status,
      clientSecret: session.client_secret || undefined,
      checkoutUrl: session.url || undefined,
      raw: session,
    };
  }

  async getPaymentStatus(providerPaymentId: string): Promise<StatusResult> {
    const session =
      await this.stripe.checkout.sessions.retrieve(providerPaymentId);

    const status: PaymentStatus =
      session.payment_status === "paid"
        ? "succeeded"
        : session.payment_status === "unpaid"
          ? "pending"
          : "failed";

    return {
      providerPaymentId,
      status,
      raw: session,
    };
  }

  async handleWebhook(req: Request): Promise<StatusResult> {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      throw new Error("Missing Stripe signature or webhook secret");
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = this.stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        webhookSecret,
      );
    } catch (err: any) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      // ℹ️ checkout.session.completed just means checkout was submitted
      // The actual payment won't be confirmed until payment_intent.succeeded arrives
      // So we return "pending" here - fulfillment will happen on payment_intent.succeeded
      const status: PaymentStatus = "pending";

      return {
        eventType: event.type,
        providerPaymentId: session.id,
        providerPaymentIntentId: session.payment_intent as string | undefined,
        orderId:
          (session.metadata?.orderId as string | undefined) ||
          (session.client_reference_id as string | undefined),
        status,
        raw: session,
      };
    }

    // Handle payment_intent.succeeded
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      return {
        eventType: event.type,
        providerPaymentId: paymentIntent.id,
        providerPaymentIntentId: paymentIntent.id,
        orderId: paymentIntent.metadata?.orderId as string | undefined,
        status: "succeeded",
        raw: paymentIntent,
      };
    }

    // Handle payment_intent.payment_failed
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      return {
        eventType: event.type,
        providerPaymentId: paymentIntent.id,
        providerPaymentIntentId: paymentIntent.id,
        orderId: paymentIntent.metadata?.orderId as string | undefined,
        status: "failed",
        raw: paymentIntent,
      };
    }

    // ⚠️ Don't fail on unhandled events - just log and skip them
    // These are informational events we don't need to process:
    // - charge.succeeded, charge.failed, charge.updated
    // - payment_intent.created, payment_intent.amount_capturable_updated
    // etc.
    // We only care about: checkout.session.completed, payment_intent.succeeded/failed
    console.log(`⏭️ Skipping unhandled webhook event type: ${event.type}`);

    // Return a neutral response so webhook isn't marked as failed
    return {
      eventType: event.type,
      providerPaymentId: "skipped",
      status: "pending" as PaymentStatus,
      raw: event,
    };
  }
}
