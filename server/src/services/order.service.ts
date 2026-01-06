import { OrderModel, CreateOrderInput, TrackingResponse } from "../models/order.model";
import { CartModel } from "../models/cart.model";
import { ProductModel } from "../models/product.model";

export class OrderService {
  /**
   * Create new order from cart
   */
  static async createOrder(userId: string, orderData: Partial<CreateOrderInput>) {
    // Get user's cart
    const cart = await CartModel.findOne({ userId }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    // Verify stock and prepare order items
    const orderItems = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const product = await ProductModel.findById(item.product);

      if (!product || !product.isActive) {
        throw new Error(`Product ${item.product} is not available`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: item.lockedPrice || product.price,
        quantity: item.quantity,
        image: product.image,
      });

      totalAmount += (item.lockedPrice || product.price) * item.quantity;

      // Reduce stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order
    const order = await OrderModel.create({
      orderNumber,
      user: userId,
      items: orderItems,
      totalAmount,
      paymentMethod: orderData.paymentMethod || 'credit_card',
      shippingAddress: orderData.shippingAddress,
      notes: orderData.notes,
    });

    // Clear cart
    await CartModel.findOneAndUpdate(
      { userId },
      { items: [], total: 0 }
    );

    return order;
  }

  /**
   * Get user's orders
   */
  static async getUserOrders(userId: string, filters?: { status?: string }) {
    const query: any = { user: userId };

    if (filters?.status) {
      query.status = filters.status;
    }

    const orders = await OrderModel.find(query)
      .sort({ createdAt: -1 })
      .populate("items.product");

    return orders;
  }

  /**
   * Get order by ID
   */
  static async getOrderById(orderId: string, userId?: string) {
    const query: any = { _id: orderId };
    
    if (userId) {
      query.user = userId;
    }

    const order = await OrderModel.findOne(query).populate("items.product");

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  }

  // ⬅️ חדש - מעקב הזמנה
  /**
   * Get order tracking information
   */
  static async getOrderTracking(orderId: string): Promise<TrackingResponse> {
    const order = await OrderModel.findById(orderId)
      .populate("items.product", "name image")
      .lean();

    if (!order) {
      throw new Error("Order not found");
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      estimatedDelivery: order.estimatedDelivery,
      trackingHistory: order.trackingHistory || [],
      items: order.items,
      totalAmount: order.totalAmount,
    };
  }

  // ⬅️ חדש - עדכון סטטוס הזמנה (להוסיף entry לhistory)
  /**
   * Update order status and add tracking entry
   */
  static async updateOrderStatus(
    orderId: string, 
    newStatus: string, 
    message?: string
  ) {
    const order = await OrderModel.findById(orderId);

    if (!order) {
      throw new Error("Order not found");
    }

    // Validate status transition
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error("Invalid status");
    }

    // Update status
    order.status = newStatus as any;

    // Add tracking entry
    order.trackingHistory.push({
      status: newStatus as any,
      timestamp: new Date(),
      message: message || `Order ${newStatus}`,
    });

    await order.save();

    return order;
  }

  /**
   * Cancel order
   */
  static async cancelOrder(orderId: string, userId: string) {
    const order = await OrderModel.findOne({ _id: orderId, user: userId });

    if (!order) {
      throw new Error("Order not found");
    }

    // Can only cancel pending/confirmed orders
    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    // Restore stock
    for (const item of order.items) {
      await ProductModel.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    // Update status
    await this.updateOrderStatus(orderId, 'cancelled', 'Order cancelled by user');

    return order;
  }

  /**
   * Generate unique order number
   */
  private static async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    // Count orders today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const count = await OrderModel.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const orderNumber = `ORD-${year}${month}${day}-${String(count + 1).padStart(3, "0")}`;

    return orderNumber;
  }
}