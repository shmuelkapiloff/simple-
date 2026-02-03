import { Request, Response } from "express";
import { OrderService } from "../services/order.service";
import { PaymentService } from "../services/payment.service";
import { createOrderSchema } from "../validators/order.validator";
import { UnauthorizedError, log } from "../utils/asyncHandler";

export class OrderController {
  /**
   * Create new order
   * POST /api/orders
   *
   * Flow:
   * 1. יצור order עם סטטוס "pending_payment"
   * 2. יצור payment intent עבור Stripe
   * 3. מחזיר clientSecret ל-CLIENT
   * 4. CLIENT משלם דרך Stripe
   * 5. Stripe שולח webhook
   * 6. Server מאמת ועדכן order
   */
  static async createOrder(req: Request, res: Response) {
    const userId = req.userId;
    const validated = createOrderSchema.parse(req.body);

    if (!userId) {
      throw new UnauthorizedError();
    }

    log.info("Order creation started", { userId });

    // 1️⃣ Create order with status = "pending_payment"
    const order = await OrderService.createOrder(userId, validated);

    // 2️⃣ Create payment intent for Stripe
    const paymentIntentResult = await PaymentService.createPaymentIntent(
      userId,
      order._id.toString()
    );

    // 3️⃣ Update order with paymentIntentId
    order.paymentIntentId =
      paymentIntentResult.payment.providerPaymentId ||
      paymentIntentResult.payment._id.toString();
    order.paymentProvider = "stripe";
    await order.save();

    log.info("Payment intent created", {
      orderId: order._id,
      status: order.status,
    });

    res.status(201).json({
      success: true,
      data: {
        order,
        payment: {
          clientSecret: paymentIntentResult.clientSecret,
          checkoutUrl: paymentIntentResult.checkoutUrl,
          status: paymentIntentResult.status,
        },
      },
      message: "Order created. Complete payment to confirm.",
    });
  }

  /**
   * Get user's orders
   * GET /api/orders?status=pending
   */
  static async getUserOrders(req: Request, res: Response) {
    const userId = req.userId;
    const { status } = req.query;

    if (!userId) {
      throw new UnauthorizedError();
    }

    const filters = status ? { status: status as string } : undefined;
    log.info("Fetching user orders", { userId, filters });
    const orders = await OrderService.getUserOrders(userId, filters);

    res.status(200).json({
      success: true,
      data: { orders },
    });
  }

  /**
   * Get order by ID
   * GET /api/orders/:orderId
   */
  static async getOrderById(req: Request, res: Response) {
    const userId = req.userId;
    const { orderId } = req.params;

    if (!userId) {
      throw new UnauthorizedError();
    }

    log.info("Fetching order", { orderId, userId });
    const order = await OrderService.getOrderById(orderId, userId);

    res.status(200).json({
      success: true,
      data: { order },
    });
  }

  /**
   * Track order (public)
   * GET /api/orders/track/:orderId
   */
  static async trackOrder(req: Request, res: Response) {
    const { orderId } = req.params;

    log.info("Order tracking", { orderId });
    const tracking = await OrderService.getOrderTracking(orderId);

    res.status(200).json({
      success: true,
      data: tracking,
    });
  }

  /**
   * Cancel order
   * POST /api/orders/:orderId/cancel
   */
  static async cancelOrder(req: Request, res: Response) {
    const userId = req.userId;
    const { orderId } = req.params;

    if (!userId) {
      throw new UnauthorizedError();
    }

    log.info("Cancelling order", { orderId, userId });
    const order = await OrderService.cancelOrder(orderId, userId);

    res.status(200).json({
      success: true,
      data: { order },
      message: "Order cancelled successfully",
    });
  }
}

