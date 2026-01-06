import { CartModel, ICart, ICartItem } from "../models/cart.model";
import { ProductModel } from "../models/product.model";
import { redis as redisClient } from "../config/redisClient";
import { track, log } from "../utils/quickLog";
import mongoose from "mongoose";

export class CartService {
  // מאפיין סטטי לDebounce של MongoDB saves
  private static pendingSaves = new Map<string, NodeJS.Timeout>();
  private static readonly CACHE_TTL = 3600; // 1 hour
  private static readonly SAVE_DELAY = 5000; // 5 seconds debounce

  // Helper: חשב סכום כולל של עגלה עם מחירים עדכניים
  private static calculateCartTotal(items: ICartItem[]): number {
    return items.reduce((sum: number, item: ICartItem) => {
      // משתמש ב-lockedPrice אם קיים, אחרת לא מחשבים (יחושב עם product.price)
      const price = item.lockedPrice || 0;
      return sum + price * item.quantity;
    }, 0);
  }

  // Get cart for authenticated user only
  static async getCart(userId: string): Promise<ICart | null> {
    const t = track("CartService", "getCart");

    try {
      const cartId = `user:${userId}`;

      // ⚡ תמיד נסה Redis קודם (מהיר!)
      const redisCart = await redisClient.get(`cart:${cartId}`);
      if (redisCart) {
        const parsedCart = JSON.parse(redisCart);

        // 🔄 תמיד נוודא שיש populate של product data
        if (parsedCart.items && parsedCart.items.length > 0) {
          const firstItem = parsedCart.items[0];
          // בדוק אם המוצר הוא מחרוזת או חסר שדות
          if (
            typeof firstItem.product === "string" ||
            !firstItem.product?.name ||
            !firstItem.product?.image
          ) {
            console.log(`⚠️ Redis cart needs re-population: ${cartId}`);

            const dbCart = await CartModel.findOne({ userId }).populate(
              "items.product"
            );

            if (dbCart) {
              const cartObj = dbCart.toObject();
              await redisClient.setex(
                `cart:${cartId}`,
                this.CACHE_TTL,
                JSON.stringify(cartObj)
              );
              console.log(
                `✅ Redis updated with fresh populated data: ${cartId}`
              );
              t.success();
              return cartObj;
            }
          }
        }

        t.success();
        return parsedCart;
      }

      console.log(`🔍 Cart not in Redis, checking MongoDB: ${cartId}`);

      // 💾 Fallback למונגו (אם Redis ריק)
      const dbCart = await CartModel.findOne({ userId }).populate(
        "items.product"
      );

      if (dbCart) {
        const cartObj = dbCart.toObject();
        await redisClient.setex(
          `cart:${cartId}`,
          this.CACHE_TTL,
          JSON.stringify(cartObj)
        );
        t.success();
        return cartObj;
      }

      t.success();
      return null;
    } catch (error) {
      t.error(error);

      // 🔄 אם Redis נפל, נסה רק מונגו
      if ((error as Error).message?.includes("Redis")) {
        try {
          const dbCart = await CartModel.findOne({ userId }).populate(
            "items.product"
          );
          console.log("🚨 Redis failed, served from MongoDB only");
          return dbCart;
        } catch (mongoError) {
          console.error("💥 Both Redis and MongoDB failed:", mongoError);
        }
      }

      return null;
    }
  }

  // 🧠 פונקציה חכמה לשמירה מתוזמנת במונגו
  private static async scheduleMongoSave(
    cartId: string,
    cart: ICart
  ): Promise<void> {
    // בטל timer קודם אם יש
    const existingTimer = this.pendingSaves.get(cartId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // צור timer חדש
    const timer = setTimeout(async () => {
      try {
        console.log(`💾 Saving to MongoDB: ${cartId}`);

        const existingCart = await CartModel.findOne({ userId: cart.userId });

        if (existingCart) {
          existingCart.items = cart.items;
          existingCart.updatedAt = new Date();
          await existingCart.save();
        } else {
          const newCart = new CartModel({
            userId: cart.userId,
            items: cart.items,
          });
          await newCart.save();
        }

        this.pendingSaves.delete(cartId);
        console.log(`✅ MongoDB save completed: ${cartId}`);
      } catch (error) {
        console.error(`❌ MongoDB save failed for ${cartId}:`, error);
        this.pendingSaves.delete(cartId);
      }
    }, this.SAVE_DELAY);

    this.pendingSaves.set(cartId, timer);
    console.log(`⏰ MongoDB save scheduled in ${this.SAVE_DELAY}ms: ${cartId}`);
  }

  // ⚡ עדכון מהיר בRedis + תזמון לmongo
  private static async updateCartInCache(
    cartId: string,
    cart: ICart
  ): Promise<void> {
    try {
      const userId = cart.userId;

      // Re-fetch with populate to ensure product details are complete
      let populatedCart = cart;
      if (cart.items.length > 0 && typeof cart.items[0].product === "string") {
        const freshCart = await CartModel.findOne({ userId }).populate(
          "items.product"
        );

        if (freshCart) {
          populatedCart = freshCart;
        }
      }

      // 1. ⚡ עדכון מיידי בRedis with populated data
      await redisClient.setex(
        `cart:${cartId}`,
        this.CACHE_TTL,
        JSON.stringify(populatedCart)
      );
      log.debug(
        "CartService",
        `Cart updated in Redis with populated products: ${cartId}`
      );

      // 2. ⏰ תזמון שמירה למונגו (לא חוסם!)
      this.scheduleMongoSave(cartId, populatedCart);
    } catch (error) {
      console.error("❌ Error updating cart cache:", error);
      throw error;
    }
  }

  // Add item to cart - ⚡ גרסה מהירה וחכמה
  static async addToCart(
    productId: string,
    quantity: number,
    userId: string
  ): Promise<ICart> {
    const t = track("CartService", "addToCart");

    try {
      const cartId = `user:${userId}`;

      // ✅ בדוק מוצר ומלאי (חייב להיות מדויק)
      const product = await ProductModel.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      if (product.stock < quantity) {
        throw new Error("Insufficient stock");
      }

      // ⚡ קבל עגלה נוכחית (מהיר מRedis)
      let cart = await this.getCart(userId);

      // צור עגלה חדשה אם לא קיימת
      if (!cart) {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        cart = new CartModel({
          userId: userObjectId,
          items: [],
          total: 0,
        });
        console.log(`🆕 Created new cart: ${cartId}`);
      }

      // חפש פריט קיים
      const existingItemIndex = cart.items.findIndex(
        (item: ICartItem) => item.product.toString() === productId
      );

      if (existingItemIndex >= 0) {
        // עדכן כמות קיימת
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;

        // בדוק מלאי כולל
        if (product.stock < newQuantity) {
          throw new Error(
            `Insufficient stock. Available: ${product.stock}, Requested: ${newQuantity}`
          );
        }

        cart.items[existingItemIndex].quantity = newQuantity;
        console.log(`📈 Updated quantity for ${product.name}: ${newQuantity}`);
      } else {
        // הוסף פריט חדש (ללא price - משתמש בחנות)
        cart.items.push({
          product: productId as any,
          quantity,
          lockedPrice: null, // null = משתמש בחנות
        });
        console.log(`➕ Added new item: ${product.name} x${quantity}`);
      }

      // חשב מחדש סכום כולל
      cart.total = cart.items.reduce((sum: number, item: ICartItem) => {
        const itemProduct =
          typeof item.product === "string" ? product : (item.product as any);

        const price = item.lockedPrice ?? (itemProduct?.price || product.price);
        return sum + price * item.quantity;
      }, 0);
      cart.updatedAt = new Date();

      // ✅ Populate המוצרים לפני עדכון cache והחזרה
      const populatedCart = await CartModel.findOne({ userId }).populate(
        "items.product"
      );

      if (!populatedCart) {
        await this.updateCartInCache(cartId, cart);
        t.success(cart);
        return cart;
      }

      const cartObject = populatedCart.toObject();

      await redisClient.setex(
        `cart:${cartId}`,
        this.CACHE_TTL,
        JSON.stringify(cartObject)
      );

      console.log(
        `⚡ Cart updated in Redis with populated products: ${cartId}`
      );
      console.log("🛒 Populated cart items:", cartObject.items.length);
      if (cartObject.items.length > 0) {
        const firstItem = cartObject.items[0];
        console.log("📦 First item product type:", typeof firstItem.product);
        console.log(
          "📦 First item product:",
          JSON.stringify(firstItem.product, null, 2)
        );
      }

      this.scheduleMongoSave(cartId, populatedCart);

      t.success(cartObject);
      return cartObject;
    } catch (error) {
      t.error(error);
      throw error;
    }
  }

  // Remove item from cart - ⚡ גרסה מהירה
  static async removeFromCart(
    productId: string,
    userId: string
  ): Promise<ICart | null> {
    const t = track("CartService", "removeFromCart");

    try {
      const cartId = `user:${userId}`;

      // ⚡ קבל עגלה נוכחית (מהיר מRedis)
      const cart = await this.getCart(userId);

      if (!cart) {
        console.log(`❌ Cart not found: ${cartId}`);
        return null;
      }

      // מצא פריט למחיקה
      const itemToRemove = cart.items.find(
        (item: ICartItem) => item.product.toString() === productId
      );

      if (!itemToRemove) {
        console.log(`❌ Item not found in cart: ${productId}`);
        return cart;
      }

      // הסר פריט
      (cart.items as any) = cart.items.filter(
        (item: ICartItem) => item.product.toString() !== productId
      );

      // חשב מחדש סכום ושמור
      cart.total = cart.items.reduce((sum: number, item: ICartItem) => {
        const itemProduct =
          typeof item.product === "string" ? undefined : (item.product as any);
        const price = item.lockedPrice ?? (itemProduct?.price || 0);
        return sum + price * item.quantity;
      }, 0);
      cart.updatedAt = new Date();

      // Populate and cache
      const populatedCart = await CartModel.findOne({ userId }).populate(
        "items.product"
      );

      if (populatedCart) {
        const cartObj = populatedCart.toObject();
        await redisClient.setex(
          `cart:${cartId}`,
          this.CACHE_TTL,
          JSON.stringify(cartObj)
        );
        this.scheduleMongoSave(cartId, populatedCart);
        t.success(cartObj);
        return cartObj;
      }

      t.success(cart);
      return cart;
    } catch (error) {
      t.error(error);
      throw error;
    }
  }

  // Update item quantity - ⚡ גרסה מהירה וחכמה
  static async updateQuantity(
    productId: string,
    quantity: number,
    userId: string
  ): Promise<ICart | null> {
    const t = track("CartService", "updateQuantity");
    console.log(`6📝 Updating quantity: ${productId} to ${quantity}`);

    // אם כמות 0 או פחות - מחק פריט
    if (quantity <= 0) {
      return this.removeFromCart(productId, userId);
    }

    const cartId = `user:${userId}`;

    try {
      console.log(
        `📝 Updating quantity: ${productId} to ${quantity} for ${cartId}`
      );

      // ⚡ קבל עגלה נוכחית (מהיר מRedis)
      const cart = await this.getCart(userId);

      if (!cart) {
        console.log(`❌ Cart not found: ${cartId}`);
        return null;
      }

      // מצא פריט לעדכון
      const itemIndex = cart.items.findIndex(
        (item: ICartItem) => item.product.toString() === productId
      );

      if (itemIndex < 0) {
        console.log(`❌ Item not found in cart: ${productId}`);
        return cart;
      }

      // ✅ בדוק מלאי (חייב להיות מדויק)
      const product = await ProductModel.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      if (product.stock < quantity) {
        throw new Error(
          `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
        );
      }

      // עדכן כמות
      cart.items[itemIndex].quantity = quantity;

      // חשב מחדש סכום
      cart.total = cart.items.reduce((sum: number, item: ICartItem) => {
        const itemProduct =
          typeof item.product === "string" ? undefined : (item.product as any);
        const price = item.lockedPrice ?? (itemProduct?.price || 0);
        return sum + price * item.quantity;
      }, 0);
      cart.updatedAt = new Date();

      // Populate and cache
      const populatedCart = await CartModel.findOne({ userId }).populate(
        "items.product"
      );

      if (populatedCart) {
        const cartObj = populatedCart.toObject();
        await redisClient.setex(
          `cart:${cartId}`,
          this.CACHE_TTL,
          JSON.stringify(cartObj)
        );
        this.scheduleMongoSave(cartId, populatedCart);
        console.log(`✅ Quantity updated: ${product?.name} x${quantity}`);
        t.success(cartObj);
        return cartObj;
      }

      t.success(cart);
      return cart;
    } catch (error) {
      t.error(error);
      console.error(`❌ Error updating quantity for ${cartId}:`, error);
      throw error;
    }
  }

  // Clear cart - עם ביטול שמירות ממתינות
  static async clearCart(userId: string): Promise<boolean> {
    const cartId = `user:${userId}`;

    try {
      console.log(`🗑️ Clearing cart: ${cartId}`);

      // ביטול שמירה ממתינה אם יש
      const pendingSave = this.pendingSaves.get(cartId);
      if (pendingSave) {
        clearTimeout(pendingSave);
        this.pendingSaves.delete(cartId);
        console.log(`⏰ Cancelled pending save for: ${cartId}`);
      }

      // מחק מRedis (מהיר)
      await redisClient.del(`cart:${cartId}`);
      console.log(`⚡ Cleared from Redis: ${cartId}`);

      // מחק ממונגו (יכול להיות איטי, אבל לא חוסם)
      CartModel.deleteOne({ userId })
        .exec()
        .then(() => {
          console.log(`💾 Cleared from MongoDB: ${cartId}`);
        })
        .catch((error: any) => {
          console.error(`❌ MongoDB delete failed for ${cartId}:`, error);
        });

      return true;
    } catch (error) {
      console.error(`❌ Error clearing cart ${cartId}:`, error);
      return false;
    }
  }

  // 🧹 פונקציה לניקוי כל הsaves הממתינים (לטסטים או shutdown)
  static async flushPendingSaves(): Promise<void> {
    console.log(`🧹 Flushing ${this.pendingSaves.size} pending saves...`);

    for (const [cartId, timer] of this.pendingSaves.entries()) {
      clearTimeout(timer);
    }

    this.pendingSaves.clear();
    console.log("✅ All pending saves cleared");
  }

  // 📊 סטטיסטיקות עגלות (למנהלים)
  static async getCartStats() {
    const t = track("CartService", "getCartStats");

    try {
      const stats = await CartModel.aggregate([
        {
          $group: {
            _id: null,
            totalCarts: { $sum: 1 },
            averageTotal: { $avg: "$total" },
            averageItems: { $avg: { $size: "$items" } },
          },
        },
      ]);

      const result = stats[0] || {
        totalCarts: 0,
        averageTotal: 0,
        averageItems: 0,
      };

      t.success(result);
      return result;
    } catch (error) {
      t.error(error);
      throw error;
    }
  }
}
