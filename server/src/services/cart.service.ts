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

  // Get cart for guest or user
  static async getCart(
    sessionId: string,
    userId?: string
  ): Promise<ICart | null> {
    const t = track("CartService", "getCart"); // 🎯 שורה אחת!

    try {
      const cartId = userId ? `user:${userId}` : `guest:${sessionId}`;

      // ⚡ תמיד נסה Redis קודם (מהיר!)
      const redisCart = await redisClient.get(`cart:${cartId}`);
      if (redisCart) {
        const parsedCart = JSON.parse(redisCart);

        // 🔄 עכשיו נוודא שיש populate של product data
        // אם parsedCart.items מכיל ObjectIds במקום אובייקטים מלאים
        if (parsedCart.items && parsedCart.items.length > 0) {
          // בדוק אם הפריט הראשון צריך populate
          const firstItem = parsedCart.items[0];
          if (
            typeof firstItem.product === "string" ||
            !firstItem.product.name
          ) {
            // Redis cart needs population, fetch from MongoDB

            // טען מהמונגו עם populate
            let query;
            if (userId) {
              // For logged-in users, only look for their cart
              query = { userId: userId };
            } else {
              // For guests, look by sessionId only
              query = { sessionId: sessionId };
            }

            const dbCart = await CartModel.findOne(query).populate(
              "items.product"
            );

            if (dbCart) {
              // עדכן את Redis עם הנתונים המלאים
              await redisClient.setex(
                `cart:${cartId}`,
                this.CACHE_TTL,
                JSON.stringify(dbCart)
              );
              console.log(
                `📥 Redis updated with populated cart data: ${cartId}`
              );
              return dbCart;
            }
          }
        }

        return parsedCart;
      }

      console.log(`🔍 Cart not in Redis, checking MongoDB: ${cartId}`);

      // 💾 Fallback למונגו (אם Redis ריק)
      let query;
      if (userId) {
        query = { userId: userId };
      } else {
        query = { sessionId: sessionId };
      }

      const dbCart = await CartModel.findOne(query).populate("items.product");

      if (dbCart) {
        // 📥 שמור בRedis לפעמים הבאות
        await redisClient.setex(
          `cart:${cartId}`,
          this.CACHE_TTL,
          JSON.stringify(dbCart)
        );
        t.success(); // 🎯 לוג הצלחה
        return dbCart;
      }

      t.success(); // 🎯 לוג הצלחה גם אם לא נמצא
      return null;
    } catch (error) {
      t.error(error); // 🎯 לוג שגיאה

      // 🔄 אם Redis נפל, נסה רק מונגו
      if ((error as Error).message?.includes("Redis")) {
        try {
          let query;
          if (userId) {
            query = { userId: userId };
          } else {
            query = { sessionId: sessionId };
          }

          const dbCart = await CartModel.findOne(query).populate(
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

        // שמור במונגו
        let query;
        if (cart.userId) {
          query = { userId: cart.userId };
        } else {
          query = { sessionId: cart.sessionId };
        }

        await CartModel.findOneAndUpdate(
          query,
          {
            sessionId: cart.sessionId,
            userId: cart.userId,
            items: cart.items,
            total: cart.total,
            updatedAt: new Date(),
          },
          {
            upsert: true,
            new: true,
          }
        );

        // נקה מהרשימה
        this.pendingSaves.delete(cartId);
        console.log(`✅ MongoDB save completed: ${cartId}`);
      } catch (error) {
        console.error(`❌ MongoDB save failed for ${cartId}:`, error);
        this.pendingSaves.delete(cartId);
      }
    }, this.SAVE_DELAY);

    // שמור את הtimer
    this.pendingSaves.set(cartId, timer);
    console.log(`⏰ MongoDB save scheduled in ${this.SAVE_DELAY}ms: ${cartId}`);
  }

  // ⚡ עדכון מהיר בRedis + תזמון לmongo
  private static async updateCartInCache(
    cartId: string,
    cart: ICart
  ): Promise<void> {
    try {
      // 1. ⚡ עדכון מיידי בRedis
      await redisClient.setex(
        `cart:${cartId}`,
        this.CACHE_TTL,
        JSON.stringify(cart)
      );
      console.log(`⚡ Cart updated in Redis: ${cartId}`);

      // 2. ⏰ תזמון שמירה למונגו (לא חוסם!)
      this.scheduleMongoSave(cartId, cart);
    } catch (error) {
      console.error("❌ Error updating cart cache:", error);
      throw error;
    }
  }

  // Add item to cart - ⚡ גרסה מהירה וחכמה
  static async addToCart(
    sessionId: string,
    productId: string,
    quantity: number,
    userId?: string
  ): Promise<ICart> {
    const t = track("CartService", "addToCart"); // 🎯 שורה אחת!

    try {
      const cartId = userId ? `user:${userId}` : `guest:${sessionId}`;

      // ✅ בדוק מוצר ומלאי (חייב להיות מדויק)
      const product = await ProductModel.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      if (product.stock < quantity) {
        throw new Error("Insufficient stock");
      }

      // ⚡ קבל עגלה נוכחית (מהיר מRedis)
      let cart = await this.getCart(sessionId, userId);

      // צור עגלה חדשה אם לא קיימת
      if (!cart) {
        const userObjectId = userId
          ? new mongoose.Types.ObjectId(userId)
          : undefined;
        cart = new CartModel({
          sessionId,
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

      // חשב מחדש סכום כולל - משתמש במחיר הנוכחי של המוצר או ב-lockedPrice אם נעול
      cart.total = cart.items.reduce((sum: number, item: ICartItem) => {
        // הביאו את המוצר עם populate כדי לקבל את הפרטים
        const itemProduct =
          typeof item.product === "string"
            ? product // אם זה אותו מוצר שזה עתה בדקנו
            : (item.product as any); // אם זה object מלא

        const price = item.lockedPrice ?? (itemProduct?.price || product.price);
        return sum + price * item.quantity;
      }, 0);
      cart.updatedAt = new Date();

      // ⚡ עדכן בcache מיידי + תזמן למונגו
      await this.updateCartInCache(cartId, cart);

      t.success(cart); // 🎯 לוג הצלחה
      return cart;
    } catch (error) {
      t.error(error); // 🎯 לוג שגיאה
      throw error;
    }
  }

  // Remove item from cart - ⚡ גרסה מהירה
  static async removeFromCart(
    sessionId: string,
    productId: string,
    userId?: string
  ): Promise<ICart | null> {
    const t = track("CartService", "removeFromCart"); // 🎯 שורה אחת!

    try {
      const cartId = userId ? `user:${userId}` : `guest:${sessionId}`;

      // ⚡ קבל עגלה נוכחית (מהיר מRedis)
      const cart = await this.getCart(sessionId, userId);

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

      // חשב מחדש סכום עם מחירים עדכניים
      const updatedCart = await this.getCart(sessionId, userId);
      if (updatedCart) {
        updatedCart.total = updatedCart.items.reduce(
          (sum: number, item: ICartItem) => {
            const itemProduct =
              typeof item.product === "string"
                ? undefined
                : (item.product as any);
            const price = item.lockedPrice ?? (itemProduct?.price || 0);
            return sum + price * item.quantity;
          },
          0
        );
        await this.updateCartInCache(cartId, updatedCart);
        t.success(updatedCart);
        return updatedCart;
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
    sessionId: string,
    productId: string,
    quantity: number,
    userId?: string
  ): Promise<ICart | null> {
    const t = track("CartService", "updateQuantity");
    console.log(`6📝 Updating quantity: ${productId} to ${quantity} for `);
    // אם כמות 0 או פחות - מחק פריט
    if (quantity <= 0) {
      return this.removeFromCart(sessionId, productId, userId);
    }

    const cartId = userId ? `user:${userId}` : `guest:${sessionId}`;

    try {
      console.log(
        `📝 Updating quantity: ${productId} to ${quantity} for ${cartId}`
      );

      // ⚡ קבל עגלה נוכחית (מהיר מRedis)
      const cart = await this.getCart(sessionId, userId);

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

      // חשב מחדש סכום כולל עם מחירים עדכניים
      const updatedCart = await this.getCart(sessionId, userId);
      if (updatedCart) {
        updatedCart.total = updatedCart.items.reduce(
          (sum: number, item: ICartItem) => {
            const itemProduct =
              typeof item.product === "string"
                ? undefined
                : (item.product as any);
            const price = item.lockedPrice ?? (itemProduct?.price || 0);
            return sum + price * item.quantity;
          },
          0
        );
        updatedCart.updatedAt = new Date();
        await this.updateCartInCache(cartId, updatedCart);
        console.log(`✅ Quantity updated: ${product?.name} x${quantity}`);
        t.success(updatedCart);
        return updatedCart;
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
  static async clearCart(sessionId: string, userId?: string): Promise<boolean> {
    const cartId = userId ? `user:${userId}` : `guest:${sessionId}`;

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
      let query;
      if (userId) {
        query = { userId: userId };
      } else {
        query = { sessionId: sessionId };
      }

      CartModel.deleteOne(query)
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
      // כאן יכולנו לשמור מיידית אם נרצה
    }

    this.pendingSaves.clear();
    console.log("✅ All pending saves cleared");
  }

  // 🔄 מיזוג עגלת אורח לעגלת משתמש (כשמשתמש מתחבר)
  static async mergeGuestCartToUser(
    guestSessionId: string,
    userId: string
  ): Promise<ICart | null> {
    const t = track("CartService", "mergeGuestCartToUser");

    try {
      console.log(
        `🔄 Merging guest cart to user: ${guestSessionId} → ${userId}`
      );

      // קבל עגלת האורח
      const guestCart = await this.getCart(guestSessionId);
      if (!guestCart || guestCart.items.length === 0) {
        console.log("⚪ No guest cart to merge");
        t.success();
        return null;
      }

      // קבל עגלת המשתמש הקיימת (אם יש)
      const userCart = await this.getCart("", userId);

      if (!userCart) {
        // אין עגלת משתמש - העבר את עגלת האורח למשתמש
        console.log("📦 No existing user cart - transferring guest cart");

        // עדכן ב-Redis
        const userCartId = `user:${userId}`;
        guestCart.userId = userId as any;
        guestCart.sessionId = null as any; // הסר session ID
        guestCart.updatedAt = new Date();

        await this.updateCartInCache(userCartId, guestCart);

        // נקה עגלת האורח
        await this.clearCart(guestSessionId);

        t.success({ merged: true, transferred: true });
        return guestCart;
      } else {
        // יש עגלת משתמש קיימת - מזג את הפריטים
        console.log("🔄 Merging items from guest cart to existing user cart");

        let hasChanges = false;

        // עבור על כל פריט בעגלת האורח
        for (const guestItem of guestCart.items) {
          const existingItemIndex = userCart.items.findIndex(
            (item: ICartItem) =>
              item.product.toString() === guestItem.product.toString()
          );

          if (existingItemIndex >= 0) {
            // פריט קיים - הוסף כמות
            const oldQuantity = userCart.items[existingItemIndex].quantity;
            userCart.items[existingItemIndex].quantity += guestItem.quantity;
            console.log(
              `➕ Merged quantities for product ${guestItem.product}: ${oldQuantity} + ${guestItem.quantity} = ${userCart.items[existingItemIndex].quantity}`
            );
            hasChanges = true;
          } else {
            // פריט חדש - הוסף לעגלה
            userCart.items.push(guestItem);
            console.log(
              `🆕 Added new item from guest cart: ${guestItem.product}`
            );
            hasChanges = true;
          }
        }

        if (hasChanges) {
          // חשב מחדש סכום כולל עם מחירים עדכניים
          userCart.total = userCart.items.reduce(
            (sum: number, item: ICartItem) => {
              const itemProduct =
                typeof item.product === "string"
                  ? undefined
                  : (item.product as any);
              const price = item.lockedPrice ?? (itemProduct?.price || 0);
              return sum + price * item.quantity;
            },
            0
          );
          userCart.updatedAt = new Date();

          // עדכן בcache
          const userCartId = `user:${userId}`;
          await this.updateCartInCache(userCartId, userCart);
        }

        // נקה עגלת האורח
        await this.clearCart(guestSessionId);

        console.log(
          `✅ Successfully merged guest cart to user cart (${guestCart.items.length} items)`
        );
        t.success({
          merged: true,
          transferred: false,
          itemsCount: guestCart.items.length,
        });
        return userCart;
      }
    } catch (error) {
      t.error(error);
      console.error("❌ Error merging guest cart:", error);
      throw error;
    }
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
            guestCarts: {
              $sum: {
                $cond: [{ $eq: ["$userId", null] }, 1, 0],
              },
            },
            userCarts: {
              $sum: {
                $cond: [{ $ne: ["$userId", null] }, 1, 0],
              },
            },
            averageTotal: { $avg: "$total" },
            averageItems: { $avg: { $size: "$items" } },
          },
        },
      ]);

      const result = stats[0] || {
        totalCarts: 0,
        guestCarts: 0,
        userCarts: 0,
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
