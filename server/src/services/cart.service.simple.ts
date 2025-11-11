import { CartModel, ICart, ICartItem } from "../models/cart.model";
import { ProductModel } from "../models/product.model";

/**
 * Simplified Cart Service - MongoDB Only
 * Perfect for learning and development
 *
 * Benefits:
 * ✅ Simple to understand
 * ✅ Easy to debug
 * ✅ No cache complexity
 * ✅ Persistent data always
 *
 * Drawbacks:
 * ⚠️ Slower than Redis (but still fast enough)
 * ⚠️ More DB load (manageable for small scale)
 */
export class SimpleCartService {
  /**
   * Get cart by sessionId or userId
   * Always fetches from MongoDB with populated product data
   */
  static async getCart(
    sessionId: string,
    userId?: string
  ): Promise<ICart | null> {
    try {
      const query = userId ? { userId } : { sessionId };
      console.log(`🔍 Fetching cart:`, query);

      const cart = await CartModel.findOne(query)
        .populate("items.product", "name price image sku stock")
        .exec();

      if (!cart) {
        console.log(`📭 No cart found for:`, query);
        return null;
      }

      console.log(`✅ Cart loaded with ${cart.items.length} items`);
      return cart;
    } catch (error) {
      console.error("❌ Error fetching cart:", error);
      throw error;
    }
  }

  /**
   * Create new cart
   */
  static async createCart(sessionId: string, userId?: string): Promise<ICart> {
    try {
      const cartData = {
        sessionId,
        userId,
        items: [],
        total: 0,
      };

      const cart = new CartModel(cartData);
      await cart.save();

      console.log(`🆕 Created new cart:`, { sessionId, userId });
      return cart;
    } catch (error) {
      console.error("❌ Error creating cart:", error);
      throw error;
    }
  }

  /**
   * Add item to cart
   */
  static async addToCart(
    sessionId: string,
    productId: string,
    quantity: number = 1,
    userId?: string
  ): Promise<ICart> {
    try {
      console.log(`➕ Adding to cart:`, { sessionId, productId, quantity });

      // 1. Find or create cart
      let cart = await this.getCart(sessionId, userId);
      if (!cart) {
        cart = await this.createCart(sessionId, userId);
      }

      // 2. Verify product exists and has stock
      const product = await ProductModel.findById(productId);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }
      if (product.stock < quantity) {
        throw new Error(
          `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
        );
      }

      // 3. Check if item already exists in cart
      const existingItemIndex = cart.items.findIndex(
        (item) => item.product._id.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Update existing item
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;

        // Check stock again
        if (product.stock < newQuantity) {
          throw new Error(
            `Insufficient stock for total quantity. Available: ${product.stock}, Requested: ${newQuantity}`
          );
        }

        cart.items[existingItemIndex].quantity = newQuantity;
        console.log(
          `🔄 Updated quantity for product ${productId} to ${newQuantity}`
        );
      } else {
        // Add new item
        const newItem: ICartItem = {
          product: product._id,
          quantity,
          price: product.price,
        };
        cart.items.push(newItem);
        console.log(`🆕 Added new item: ${product.name} (${quantity})`);
      }

      // 4. Recalculate total
      cart.total = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // 5. Save and return with populated data
      await cart.save();

      // Return populated cart
      return (await this.getCart(sessionId, userId)) as ICart;
    } catch (error) {
      console.error("❌ Error adding to cart:", error);
      throw error;
    }
  }

  /**
   * Update item quantity in cart
   */
  static async updateQuantity(
    sessionId: string,
    productId: string,
    quantity: number,
    userId?: string
  ): Promise<ICart> {
    try {
      console.log(`📝 Updating quantity:`, { sessionId, productId, quantity });

      const cart = await this.getCart(sessionId, userId);
      if (!cart) {
        throw new Error("Cart not found");
      }

      const itemIndex = cart.items.findIndex(
        (item) => item.product._id.toString() === productId
      );

      if (itemIndex === -1) {
        throw new Error("Item not found in cart");
      }

      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        cart.items.splice(itemIndex, 1);
        console.log(`🗑️ Removed item ${productId} from cart`);
      } else {
        // Verify stock
        const product = await ProductModel.findById(productId);
        if (!product) {
          throw new Error("Product not found");
        }
        if (product.stock < quantity) {
          throw new Error(`Insufficient stock. Available: ${product.stock}`);
        }

        // Update quantity
        cart.items[itemIndex].quantity = quantity;
        console.log(`📝 Updated ${productId} quantity to ${quantity}`);
      }

      // Recalculate total
      cart.total = cart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      await cart.save();

      // Return populated cart
      return (await this.getCart(sessionId, userId)) as ICart;
    } catch (error) {
      console.error("❌ Error updating quantity:", error);
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  static async removeFromCart(
    sessionId: string,
    productId: string,
    userId?: string
  ): Promise<ICart> {
    try {
      console.log(`🗑️ Removing from cart:`, { sessionId, productId });

      return await this.updateQuantity(sessionId, productId, 0, userId);
    } catch (error) {
      console.error("❌ Error removing from cart:", error);
      throw error;
    }
  }

  /**
   * Clear entire cart
   */
  static async clearCart(sessionId: string, userId?: string): Promise<ICart> {
    try {
      console.log(`🧹 Clearing cart:`, { sessionId, userId });

      const cart = await this.getCart(sessionId, userId);
      if (!cart) {
        throw new Error("Cart not found");
      }

      cart.items = [];
      cart.total = 0;
      await cart.save();

      console.log(`✅ Cart cleared successfully`);
      return cart;
    } catch (error) {
      console.error("❌ Error clearing cart:", error);
      throw error;
    }
  }

  /**
   * Get cart item count
   */
  static async getCartCount(
    sessionId: string,
    userId?: string
  ): Promise<number> {
    try {
      const cart = await this.getCart(sessionId, userId);
      if (!cart) return 0;

      const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      console.log(`📊 Cart count for ${sessionId}: ${count}`);

      return count;
    } catch (error) {
      console.error("❌ Error getting cart count:", error);
      throw error;
    }
  }

  /**
   * Convert cart to order data (for checkout)
   */
  static async getCartForCheckout(
    sessionId: string,
    userId?: string
  ): Promise<{ items: ICartItem[]; total: number } | null> {
    try {
      const cart = await this.getCart(sessionId, userId);
      if (!cart || cart.items.length === 0) {
        return null;
      }

      // Verify all products still exist and have sufficient stock
      for (const item of cart.items) {
        const product = await ProductModel.findById(item.product._id);
        if (!product) {
          throw new Error(`Product ${item.product._id} no longer exists`);
        }
        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${product.stock}`
          );
        }
      }

      return {
        items: cart.items,
        total: cart.total,
      };
    } catch (error) {
      console.error("❌ Error preparing cart for checkout:", error);
      throw error;
    }
  }
}

export default SimpleCartService;
