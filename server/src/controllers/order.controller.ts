import { Request, Response } from "express";
import {
  OrderService,
  CreateOrderData,
  OrderFilters,
} from "../services/order.service";
import { sendSuccess, sendError } from "../utils/response";
import { logger } from "../utils/logger";
import { z } from "zod";

// Validation schemas
const CreateOrderSchema = z.object({
  shippingAddress: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().optional().default("Israel"),
  }),
  paymentMethod: z.enum(["credit_card", "paypal", "cash_on_delivery"]),
  notes: z.string().optional(),
});

const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]),
});

export class OrderController {
  /**
   * Create a new order from cart
   * POST /api/orders
   */
  static async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        return sendError(res, 401, "Authentication required");
      }

      // Validate request body
      const validation = CreateOrderSchema.safeParse(req.body);
      if (!validation.success) {
        return sendError(
          res,
          400,
          "Invalid order data",
          validation.error.errors
        );
      }

      const orderData: CreateOrderData = {
        userId,
        ...validation.data,
      };

      // Create the order
      const order = await OrderService.createOrderFromCart(orderData);

      logger.info(
        `📋 Order created successfully: ${order.orderNumber} for user: ${userId}`
      );

      sendSuccess(
        res,
        {
          order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            items: order.items,
            totalAmount: order.totalAmount,
            status: order.status,
            shippingAddress: order.shippingAddress,
            paymentMethod: order.paymentMethod,
            paymentStatus: order.paymentStatus,
            estimatedDelivery: order.estimatedDelivery,
            createdAt: order.createdAt,
          },
        },
        "ההזמנה נוצרה בהצלחה! 🎉",
        201
      );
    } catch (error: any) {
      logger.error("❌ Create order failed:", error);

      if (
        error.message.includes("Cart is empty") ||
        error.message.includes("Cart not found")
      ) {
        return sendError(
          res,
          400,
          "העגלה ריקה או לא נמצאה. אנא הוסף פריטים לעגלה."
        );
      }

      if (error.message.includes("Insufficient stock")) {
        return sendError(res, 400, error.message);
      }

      sendError(res, 500, "שגיאה ביצירת ההזמנה. אנא נסה שוב.");
    }
  }

  /**
   * Get user's orders
   * GET /api/orders?status=pending&limit=10&offset=0
   */
  static async getUserOrders(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        return sendError(res, 401, "Authentication required");
      }

      const { status, limit = "10", offset = "0" } = req.query;

      const filters: OrderFilters = {
        userId,
        status: status as string,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      };

      const result = await OrderService.getUserOrders(filters);

      sendSuccess(res, result, "הזמנות נטענו בהצלחה");
    } catch (error: any) {
      logger.error("❌ Get user orders failed:", error);
      sendError(res, 500, "שגיאה בטעינת ההזמנות");
    }
  }

  /**
   * Get specific order by ID
   * GET /api/orders/:orderId
   */
  static async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const { orderId } = req.params;

      if (!userId) {
        return sendError(res, 401, "Authentication required");
      }

      const order = await OrderService.getOrderById(orderId, userId);

      if (!order) {
        return sendError(res, 404, "הזמנה לא נמצאה");
      }

      sendSuccess(res, { order }, "פרטי ההזמנה נטענו בהצלחה");
    } catch (error: any) {
      logger.error("❌ Get order by ID failed:", error);
      sendError(res, 500, "שגיאה בטעינת פרטי ההזמנה");
    }
  }

  /**
   * Cancel an order
   * POST /api/orders/:orderId/cancel
   */
  static async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      const { orderId } = req.params;

      if (!userId) {
        return sendError(res, 401, "Authentication required");
      }

      const order = await OrderService.cancelOrder(orderId, userId);

      if (!order) {
        return sendError(res, 404, "הזמנה לא נמצאה");
      }

      sendSuccess(res, { order }, "ההזמנה בוטלה בהצלחה");
    } catch (error: any) {
      logger.error("❌ Cancel order failed:", error);

      if (error.message.includes("Cannot cancel")) {
        return sendError(res, 400, error.message);
      }

      sendError(res, 500, "שגיאה בביטול ההזמנה");
    }
  }

  /**
   * Update order status (Admin only)
   * PUT /api/orders/:orderId/status
   */
  static async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;

      // Validate request body
      const validation = UpdateOrderStatusSchema.safeParse(req.body);
      if (!validation.success) {
        return sendError(res, 400, "Invalid status", validation.error.errors);
      }

      const { status } = validation.data;

      const order = await OrderService.updateOrderStatus(orderId, status);

      if (!order) {
        return sendError(res, 404, "הזמנה לא נמצאה");
      }

      sendSuccess(res, { order }, `סטטוס ההזמנה עודכן ל-${status}`);
    } catch (error: any) {
      logger.error("❌ Update order status failed:", error);
      sendError(res, 500, "שגיאה בעדכון סטטוס ההזמנה");
    }
  }

  /**
   * Get order statistics (Admin only)
   * GET /api/orders/stats
   */
  static async getOrderStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await OrderService.getOrderStats();

      sendSuccess(res, stats, "סטטיסטיקות הזמנות נטענו בהצלחה");
    } catch (error: any) {
      logger.error("❌ Get order stats failed:", error);
      sendError(res, 500, "שגיאה בטעינת סטטיסטיקות ההזמנות");
    }
  }
}
