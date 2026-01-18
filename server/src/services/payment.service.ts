import { Request } from "express";
import { PaymentModel, PaymentStatus } from "../models/payment.model";
import { OrderModel } from "../models/order.model";
import { CartModel } from "../models/cart.model";
import { ProductModel } from "../models/product.model";
import { PaymentProvider } from "./payments/payment.provider";
import { MockProvider } from "./payments/mock.provider";
import { StripeProvider } from "./payments/stripe.provider";

// Register payment providers here - easy to add PayPal, Square, etc.
const providers: Record<string, PaymentProvider> = {
  mock: new MockProvider(),
  stripe: process.env.STRIPE_SECRET_KEY
    ? new StripeProvider()
    : new MockProvider(),
  // Add more providers as needed:
  // paypal: new PayPalProvider(),
  // square: new SquareProvider(),
};

const mapToOrderPaymentStatus = (
  status: PaymentStatus
): "pending" | "paid" | "failed" | "refunded" => {
  if (status === "succeeded") return "paid";
  if (status === "refunded") return "refunded";
  if (status === "failed" || status === "canceled") return "failed";
  return "pending";
};

export class PaymentService {
  private static getProvider(): PaymentProvider {
    const key = (process.env.PAYMENT_PROVIDER || "mock").toLowerCase();
    return providers[key] || providers.mock;
  }

  /**
   * Create payment intent for an order
   */
  static async createPaymentIntent(userId: string, orderId: string) {
    const order = await OrderModel.findOne({ _id: orderId, user: userId });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.paymentStatus === "paid") {
      throw new Error("Order already paid");
    }

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
      providerPaymentId: intent.providerPaymentId,
      clientSecret: intent.clientSecret,
      checkoutUrl: intent.checkoutUrl,
      meta: intent.raw,
    });

    order.paymentStatus = mapToOrderPaymentStatus(intent.status);
    await order.save();

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
   * Handle provider webhook
   */
  static async handleWebhook(req: Request) {
    const provider = this.getProvider();
    const result = await provider.handleWebhook(req);

    const payment = await PaymentModel.findOne({
      providerPaymentId: result.providerPaymentId,
    });

    if (payment) {
      payment.status = result.status;
      payment.meta = result.raw || payment.meta;
      await payment.save();

      const order = await OrderModel.findById(payment.order);
      if (order) {
        order.paymentStatus = mapToOrderPaymentStatus(result.status);
        await order.save();
      }
    }

    return { ok: true };
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
      { items: [], total: 0 }
    );

    // 5. Update payment record
    const payment = await PaymentModel.findOneAndUpdate(
      { order: order._id },
      { status: "succeeded" },
      { new: true }
    );

    return { order, payment };
  }
}
