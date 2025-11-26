import Order, { IOrder, IOrderItem } from "../models/order.model";
import { CartModel } from "../models/cart.model";
import { ProductModel, Product } from "../models/product.model";
import mongoose from "mongoose";
import { logger } from "../utils/logger";

export interface CreateOrderData {
  userId: string;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country?: string;
  };
  paymentMethod: "credit_card" | "paypal" | "cash_on_delivery";
  notes?: string;
}

export interface OrderFilters {
  userId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export class OrderService {
  /**
   * Create a new order from user's cart
   */
  static async createOrderFromCart(data: CreateOrderData): Promise<IOrder> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      logger.info(`📋 Creating order for user: ${data.userId}`);

      // Convert string userId to ObjectId for query
      const userObjectId = new mongoose.Types.ObjectId(data.userId);

      // Get user's cart
      const cart = await CartModel.findOne({ userId: userObjectId }).populate({
        path: "items.product",
        model: "Product",
      });

      if (!cart || cart.items.length === 0) {
        const message = !cart
          ? "Cart not found for user"
          : "Cart is empty. Cannot create order.";
        throw new Error(message);
      }

      // Validate product availability and calculate total
      let totalAmount = 0;
      const orderItems: IOrderItem[] = [];

      for (const cartItem of cart.items) {
        const product = cartItem.product as any;

        if (!product) {
          throw new Error(`Product not found for cart item`);
        }

        // Check if product is still available
        if (product.stock < cartItem.quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${cartItem.quantity}`
          );
        }

        // Create order item
        const orderItem: IOrderItem = {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: cartItem.quantity,
          image: product.image || "📦",
        };

        orderItems.push(orderItem);
        totalAmount += product.price * cartItem.quantity;

        // Update product stock
        await ProductModel.findByIdAndUpdate(
          product._id,
          { $inc: { stock: -cartItem.quantity } },
          { session }
        );
      }

      // Create the order
      const order = new Order({
        user: data.userId,
        items: orderItems,
        totalAmount,
        shippingAddress: {
          ...data.shippingAddress,
          country: data.shippingAddress.country || "Israel",
        },
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      });

      await order.save({ session });

      // Clear the cart
      await CartModel.findOneAndUpdate(
        { userId: data.userId },
        { $set: { items: [] } },
        { session }
      );

      await session.commitTransaction();

      logger.info(`✅ Order created successfully: ${order.orderNumber}`);

      return order;
    } catch (error) {
      await session.abortTransaction();
      logger.error({ error }, "❌ Failed to create order");
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get user's orders with pagination
   */
  static async getUserOrders(filters: OrderFilters): Promise<{
    orders: IOrder[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const { userId, status, limit = 10, offset = 0 } = filters;

      const query: any = {};
      if (userId) query.user = userId;
      if (status) query.status = status;

      const total = await Order.countDocuments(query);

      const orders = await Order.find(query)
        .populate({
          path: "items.product",
          model: "Product",
          select: "name image",
        })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);

      const hasMore = offset + limit < total;

      logger.info(`📋 Retrieved ${orders.length} orders for user ${userId}`);

      return { orders, total, hasMore };
    } catch (error) {
      logger.error({ error }, "❌ Failed to get user orders");
      throw error;
    }
  }

  /**
   * Get order by ID and user
   */
  static async getOrderById(
    orderId: string,
    userId?: string
  ): Promise<IOrder | null> {
    try {
      const query: any = { _id: orderId };
      if (userId) query.user = userId;

      const order = await Order.findOne(query).populate({
        path: "items.product",
        model: "Product",
        select: "name image description",
      });

      if (order) {
        logger.info(`📋 Retrieved order: ${order.orderNumber}`);
      }

      return order;
    } catch (error) {
      logger.error({ error }, "❌ Failed to get order by ID");
      throw error;
    }
  }

  /**
   * Update order status (admin only)
   */
  static async updateOrderStatus(
    orderId: string,
    status: IOrder["status"]
  ): Promise<IOrder | null> {
    try {
      const order = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            status,
            ...(status === "delivered" && { estimatedDelivery: new Date() }),
          },
        },
        { new: true }
      ).populate({
        path: "items.product",
        model: "Product",
        select: "name image",
      });

      if (order) {
        logger.info(
          `📋 Updated order ${order.orderNumber} status to: ${status}`
        );
      }

      return order;
    } catch (error) {
      logger.error({ error }, "❌ Failed to update order status");
      throw error;
    }
  }

  /**
   * Cancel order (user can cancel pending/processing orders)
   */
  static async cancelOrder(
    orderId: string,
    userId: string
  ): Promise<IOrder | null> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the order
      const order = await Order.findOne({ _id: orderId, user: userId });

      if (!order) {
        throw new Error("Order not found");
      }

      if (!["pending", "processing"].includes(order.status)) {
        throw new Error(`Cannot cancel order with status: ${order.status}`);
      }

      // Restore product stock
      for (const item of order.items) {
        await ProductModel.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } },
          { session }
        );
      }

      // Update order status
      order.status = "cancelled";
      await order.save({ session });

      await session.commitTransaction();

      logger.info(`📋 Order cancelled: ${order.orderNumber}`);

      return order;
    } catch (error) {
      await session.abortTransaction();
      logger.error({ error }, "❌ Failed to cancel order");
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get order statistics for admin dashboard
   */
  static async getOrderStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
    recentOrders: IOrder[];
  }> {
    try {
      const [
        totalOrders,
        pendingOrders,
        completedOrders,
        revenueResult,
        recentOrders,
      ] = await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: "pending" }),
        Order.countDocuments({ status: "delivered" }),
        Order.aggregate([
          { $match: { paymentStatus: "paid" } },
          { $group: { _id: null, total: { $sum: "$totalAmount" } } },
        ]),
        Order.find()
          .populate("user", "name email")
          .sort({ createdAt: -1 })
          .limit(10),
      ]);

      const totalRevenue =
        revenueResult.length > 0 ? revenueResult[0].total : 0;

      return {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
        recentOrders,
      };
    } catch (error) {
      logger.error({ error }, "❌ Failed to get order statistics");
      throw error;
    }
  }
}
