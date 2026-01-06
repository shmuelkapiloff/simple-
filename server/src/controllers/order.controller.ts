import { Request, Response } from "express";
import { OrderService } from "../services/order.service";
import { CreateOrderInput } from "../models/order.model";

export class OrderController {
  /**
   * Create new order
   * POST /api/orders
   */
  static async createOrder(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const orderData: Partial<CreateOrderInput> = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      // Validate shipping address
      if (!orderData.shippingAddress) {
        return res.status(400).json({
          success: false,
          message: "Shipping address is required",
        });
      }

      const { street, city, postalCode } = orderData.shippingAddress;
      if (!street || !city || !postalCode) {
        return res.status(400).json({
          success: false,
          message: "Complete shipping address (street, city, postalCode) is required",
        });
      }

      const order = await OrderService.createOrder(userId, orderData);

      res.status(201).json({
        success: true,
        data: { order },
        message: "Order created successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create order",
      });
    }
  }

  /**
   * Get user's orders
   * GET /api/orders?status=pending
   */
  static async getUserOrders(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { status } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const filters = status ? { status: status as string } : undefined;
      const orders = await OrderService.getUserOrders(userId, filters);

      res.status(200).json({
        success: true,
        data: { orders },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch orders",
      });
    }
  }

  /**
   * Get order by ID
   * GET /api/orders/:orderId
   */
  static async getOrderById(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { orderId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const order = await OrderService.getOrderById(orderId, userId);

      res.status(200).json({
        success: true,
        data: { order },
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "Order not found",
      });
    }
  }

  // ⬅️ חדש - מעקב הזמנה
  /**
   * Track order
   * GET /api/orders/track/:orderId
   */
  static async trackOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;

      const tracking = await OrderService.getOrderTracking(orderId);

      res.status(200).json({
        success: true,
        data: tracking,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "Order not found",
      });
    }
  }

  /**
   * Cancel order
   * POST /api/orders/:orderId/cancel
   */
  static async cancelOrder(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { orderId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const order = await OrderService.cancelOrder(orderId, userId);

      res.status(200).json({
        success: true,
        data: { order },
        message: "Order cancelled successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to cancel order",
      });
    }
  }
}
