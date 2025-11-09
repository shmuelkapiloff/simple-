import { CartModel, ICart, ICartItem } from "../models/cart.model";
import { ProductModel } from "../models/product.model";
import { redis as redisClient } from "../config/redisClient";

// Service functions for cart management
export class CartService {
  // מאפיין סטטי לDebounce של MongoDB saves
  private static pendingSaves = new Map<string, NodeJS.Timeout>();
  private static readonly CACHE_TTL = 3600; // 1 hour
  private static readonly SAVE_DELAY = 5000; // 5 seconds debounce
  // Get cart for guest or user
  static async getCart(
    sessionId: string,
    userId?: string
  ): Promise<ICart | null> {
    const cartId = userId ? `user:${userId}` : `guest:${sessionId}`;
    console.log(`1🔍 Fetching cart: ${cartId}`);
    try {
      // ⚡ תמיד נסה Redis קודם (מהיר!)
      const redisCart = await redisClient.get(`cart:${cartId}`);
      if (redisCart) {
        const parsedCart = JSON.parse(redisCart);
        console.log(`✅ Cart loaded from Redis: ${cartId}`);
        
        // 🔄 עכשיו נוודא שיש populate של product data
        // אם parsedCart.items מכיל ObjectIds במקום אובייקטים מלאים
        if (parsedCart.items && parsedCart.items.length > 0) {
          // בדוק אם הפריט הראשון צריך populate
          const firstItem = parsedCart.items[0];
          if (typeof firstItem.product === 'string' || !firstItem.product.name) {
            console.log(`🔄 Redis cart needs population, fetching from MongoDB: ${cartId}`);
            
            // טען מהמונגו עם populate
            const dbCart = await CartModel.findOne({
              $or: [{ sessionId: sessionId }, { userId: userId }],
            }).populate("items.product");
            
            if (dbCart) {
              // עדכן את Redis עם הנתונים המלאים
              await redisClient.setex(
                `cart:${cartId}`,
                this.CACHE_TTL,
                JSON.stringify(dbCart)
              );
              console.log(`📥 Redis updated with populated cart data: ${cartId}`);
              return dbCart;
            }
          }
        }
        
        return parsedCart;
      }

      console.log(`🔍 Cart not in Redis, checking MongoDB: ${cartId}`);

      // 💾 Fallback למונגו (אם Redis ריק)
      const dbCart = await CartModel.findOne({
        $or: [{ sessionId: sessionId }, { userId: userId }],
      }).populate("items.product");

      if (dbCart) {
        // 📥 שמור בRedis לפעמים הבאות
        await redisClient.setex(
          `cart:${cartId}`,
          this.CACHE_TTL,
          JSON.stringify(dbCart)
        );
        console.log(`📥 Cart cached in Redis from MongoDB: ${cartId}`);
        return dbCart;
      }

      console.log(`❌ No cart found: ${cartId}`);
      return null;
    } catch (error) {
      console.error("❌ Error getting cart:", error);

      // 🔄 אם Redis נפל, נסה רק מונגו
      if ((error as Error).message?.includes("Redis")) {
        try {
          const dbCart = await CartModel.findOne({
            $or: [{ sessionId: sessionId }, { userId: userId }],
          }).populate("items.product");

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
    console.log(`2scheduleMongoSave: ${cartId}  ${cart}`);
    // בטל timer קודם אם יש
    const existingTimer = this.pendingSaves.get(cartId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // צור timer חדש
    const timer = setTimeout(async () => {
      console.log(`setTimeout: ${cartId}`);
      try {
        console.log(`💾 Saving to MongoDB: ${cartId}`);

        // שמור במונגו
        await CartModel.findOneAndUpdate(
          {
            $or: [{ sessionId: cart.sessionId }, { userId: cart.userId }],
          },
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
    console.log(`3🗄️ Updating cart in cache: ${cartId}  ${cart}`);
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
    const cartId = userId ? `user:${userId}` : `guest:${sessionId}`;
    console.log(`4🛒 Adding to cart: ${productId} x${quantity} for ${cartId}`);

    try {
      console.log(`🛒 Adding to cart: ${productId} x${quantity} for ${cartId}`);

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
        cart = new CartModel({
          sessionId,
          userId,
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
        // הוסף פריט חדש
        cart.items.push({
          product: productId as any,
          quantity,
          price: product.price,
        });
        console.log(`➕ Added new item: ${product.name} x${quantity}`);
      }

      // חשב מחדש סכום כולל
      cart.total = cart.items.reduce(
        (sum: number, item: ICartItem) => sum + item.price * item.quantity,
        0
      );
      cart.updatedAt = new Date();

      // ⚡ עדכן בcache מיידי + תזמן למונגו
      await this.updateCartInCache(cartId, cart);

      console.log(
        `✅ Cart updated successfully: ${cartId}, Total: $${cart.total}`
      );
      return cart;
    } catch (error) {
      console.error(`❌ Error adding to cart ${cartId}:`, error);
      throw error;
    }
  }

  // Remove item from cart - ⚡ גרסה מהירה
  static async removeFromCart(
    sessionId: string,
    productId: string,
    userId?: string
  ): Promise<ICart | null> {
    const cartId = userId ? `user:${userId}` : `guest:${sessionId}`;
    console.log(`5🗑️ Removing from cart: ${productId} for ${cartId}`);
    try {
      console.log(`🗑️ Removing from cart: ${productId} for ${cartId}`);

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

      // חשב מחדש סכום
      cart.total = cart.items.reduce(
        (sum: number, item: ICartItem) => sum + item.price * item.quantity,
        0
      );
      cart.updatedAt = new Date();

      // ⚡ עדכן בcache מיידי + תזמן למונגו
      await this.updateCartInCache(cartId, cart);

      console.log(`✅ Item removed successfully: ${productId}`);
      return cart;
    } catch (error) {
      console.error(`❌ Error removing from cart ${cartId}:`, error);
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

      // חשב מחדש סכום כולל
      cart.total = cart.items.reduce(
        (sum: number, item: ICartItem) => sum + item.price * item.quantity,
        0
      );
      cart.updatedAt = new Date();

      // ⚡ עדכן בcache מיידי + תזמן למונגו
      await this.updateCartInCache(cartId, cart);

      console.log(`✅ Quantity updated: ${product.name} x${quantity}`);
      return cart;
    } catch (error) {
      console.error(`❌ Error updating quantity for ${cartId}:`, error);
      throw error;
    }
  }

  // Clear cart - עם ביטול שמירות ממתינות
  static async clearCart(sessionId: string, userId?: string): Promise<boolean> {
    const cartId = userId ? `user:${userId}` : `guest:${sessionId}`;
    console.log(`7🗑️ Clearing cart: ${cartId}`);

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
      CartModel.deleteOne({
        $or: [{ sessionId: sessionId }, { userId: userId }],
      })
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
    console.log(`8🧹 Flushing ${this.pendingSaves.size} pending saves...`);
    console.log(`🧹 Flushing ${this.pendingSaves.size} pending saves...`);

    for (const [cartId, timer] of this.pendingSaves.entries()) {
      clearTimeout(timer);
      // כאן יכולנו לשמור מיידית אם נרצה
    }

    this.pendingSaves.clear();
    console.log("✅ All pending saves cleared");
  }
}
