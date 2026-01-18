import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";
import { asyncHandler } from "../utils/asyncHandler";
import { OrderModel } from "../models/order.model";

export class PaymentController {
  /**
   * Create payment intent
   * POST /api/payments/create-intent
   */
  static createIntent = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { orderId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    const result = await PaymentService.createPaymentIntent(userId, orderId);

    res.status(200).json({
      success: true,
      data: {
        payment: result.payment,
        status: result.status,
        clientSecret: result.clientSecret,
        checkoutUrl: result.checkoutUrl,
      },
    });
  });

  /**
   * Get payment status by order
   * GET /api/payments/:orderId/status
   */
  static getStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const result = await PaymentService.getPaymentStatus(userId, orderId);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Webhook endpoint (public) - Stripe calls this
   * POST /api/payments/webhook
   * ✅ This is the CRITICAL endpoint that confirms payments!
   */
  static webhook = asyncHandler(async (req: Request, res: Response) => {
    const event = req.body;

    // ✅ Basic validation (in production, verify Stripe signature)
    if (!event.id) {
      return res.status(400).json({ received: false, error: "Invalid event" });
    }

    try {
      // 🎯 Handle payment success
      if (event.type === "payment_intent.succeeded") {
        const paymentIntentId = event.data.object.id;
        const result = await PaymentService.confirmPayment(paymentIntentId);
        console.log("✅ Payment confirmed via webhook", {
          orderId: result.order._id,
          amount: result.order.totalAmount,
        });
      }

      // 🎯 Handle payment failure
      if (event.type === "payment_intent.payment_failed") {
        const paymentIntentId = event.data.object.id;
        const order = await OrderModel.findOne({ paymentIntentId });
        if (order) {
          order.paymentStatus = "failed";
          order.status = "cancelled";
          await order.save();
          console.log("❌ Payment failed via webhook", { orderId: order._id });
        }
      }

      // ✅ Tell Stripe we received the event
      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ received: false, error: String(error) });
    }
  });
}
