import { CartModel, ICart, ICartItem } from "../models/cart.model";
import { ProductModel } from "../models/product.model";
import { redis as redisClient } from "../config/redisClient";
import { log, logger, track } from "../utils/logger";
import { CART_CACHE_TTL, CART_SAVE_DELAY } from "../config/constants";
import mongoose from "mongoose";
import { ApiError } from "../utils/asyncHandler";

export class CartService {
  // מאפיין סטטי לDebounce של MongoDB saves
  private static pendingSaves = new Map<string, NodeJS.Timeout>();
  private static readonly CACHE_TTL = CART_CACHE_TTL; // From constants
  private static readonly SAVE_DELAY = CART_SAVE_DELAY; // From constants

  // ✅ Redis helpers: best-effort cache that never throws
  private static isRedisReady(): boolean {
    return redisClient.status === "ready";
  }

  private static async safeCacheSet(
    key: string,
    ttlSeconds: number,
    payload: any,
  ): Promise<void> {
    if (!this.isRedisReady()) {
      logger.warn({ key }, "Redis not ready, skipping cache set");
      return;
    }

    try {
      await redisClient.setex(key, ttlSeconds, JSON.stringify(payload));
    } catch (error) {
      logger.warn({ error, key }, "Redis set failed (swallowed)");
    }
  }

  private static async safeCacheDel(key: string): Promise<void> {
    if (!this.isRedisReady()) {
      logger.warn({ key }, "Redis not ready, skipping cache delete");
      return;
    }

    try {
      await redisClient.del(key);
    } catch (error) {
      logger.warn({ error, key }, "Redis delete failed (swallowed)");
    }
  }

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

      // ⚡ נסה Redis קודם (אם זמין)
      try {
        if (this.isRedisReady()) {
          const redisCart = await redisClient.get(`cart:${cartId}`);
          if (redisCart) {
            const parsedCart = JSON.parse(redisCart);

            // ✅ בדוק אם יש פריטים ואם המוצרים כולם populated
            if (parsedCart.items && parsedCart.items.length > 0) {
              const firstItem = parsedCart.items[0];

              // בדוק אם זה בא מRedis בצורה נכונה (עם product details)
              const isFullyPopulated =
                typeof firstItem.product === "object" &&
                firstItem.product?.name &&
                firstItem.product?.price;

              if (!isFullyPopulated) {
                logger.warn(
                  `⚠️ Redis cache not fully populated, refreshing from MongoDB: ${cartId}`,
                );

                // ⚡ עדכן מMongoDB עם populate מלא
                const dbCart = await CartModel.findOne({ userId }).populate(
                  "items.product",
                );

                if (dbCart) {
                  const cartObj = dbCart.toObject();
                  await this.safeCacheSet(
                    `cart:${cartId}`,
                    this.CACHE_TTL,
                    cartObj,
                  );
                  logger.info(
                    `✅ Redis refreshed with populated data: ${cartId}`,
                  );
                  t.success(cartObj);
                  return cartObj;
                }
              }
            }

            // ✅ Redis data בסדר ותקין
            logger.debug(`✅ Returning cart from Redis cache: ${cartId}`);
            t.success(parsedCart);
            return parsedCart;
          }
        } else {
          logger.warn(`⚠️ Redis not ready, skipping cache read: ${cartId}`);
        }
      } catch (redisError) {
        logger.warn({ redisError, cartId }, "Redis read failed (swallowed)");
      }

      logger.info(`🔍 Cart not in Redis, checking MongoDB: ${cartId}`);

      // 💾 Fallback למונגו (אם Redis ריק או נפל)
      const dbCart = await CartModel.findOne({ userId }).populate(
        "items.product",
      );

      if (dbCart) {
        const cartObj = dbCart.toObject();
        await this.safeCacheSet(`cart:${cartId}`, this.CACHE_TTL, cartObj);
        logger.info(`✅ Cart loaded from MongoDB and cached: ${cartId}`);
        t.success(cartObj);
        return cartObj;
      }

      logger.debug(`ℹ️ No cart found for user: ${cartId}`);
      t.success(null);
      return null;
    } catch (error) {
      t.error(error);
      return null;
    }
  }

  // 🧠 פונקציה חכמה לשמירה מתוזמנת במונגו
  private static async scheduleMongoSave(
    cartId: string,
    cart: ICart | any, // יכול להיות Mongoose doc או plain object מRedis
  ): Promise<void> {
    // בטל timer קודם אם יש
    const existingTimer = this.pendingSaves.get(cartId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // צור timer חדש
    const timer = setTimeout(async () => {
      try {
        logger.info(`💾 Saving to MongoDB: ${cartId}`);

        // ✅ קבל את userId בצורה בטוחה
        const userId = (cart as any).userId;
        const existingCart = await CartModel.findOne({ userId });

        if (existingCart) {
          // ✅ המר items לצורה נכונה אם הגיעו מRedis
          const items = (cart as any).items || [];
          existingCart.items = items;
          existingCart.updatedAt = new Date();
          await existingCart.save();
          logger.info(`✅ Updated existing cart in MongoDB: ${cartId}`);
        } else {
          const newCart = new CartModel({
            userId,
            items: (cart as any).items || [],
          });
          await newCart.save();
          logger.info(`✅ Created new cart in MongoDB: ${cartId}`);
        }

        this.pendingSaves.delete(cartId);
        logger.info(`✅ MongoDB save completed: ${cartId}`);
      } catch (error) {
        logger.error({ error, cartId }, `❌ MongoDB save failed for ${cartId}`);
        this.pendingSaves.delete(cartId);
      }
    }, this.SAVE_DELAY);

    this.pendingSaves.set(cartId, timer);
    logger.info(`⏰ MongoDB save scheduled in ${this.SAVE_DELAY}ms: ${cartId}`);
  }

  // ⚡ עדכון מהיר בRedis + תזמון לmongo
  private static async updateCartInCache(
    cartId: string,
    cart: ICart,
  ): Promise<void> {
    try {
      const userId = cart.userId;

      // Re-fetch with populate to ensure product details are complete
      let populatedCart = cart;
      if (cart.items.length > 0 && typeof cart.items[0].product === "string") {
        const freshCart = await CartModel.findOne({ userId }).populate(
          "items.product",
        );

        if (freshCart) {
          populatedCart = freshCart;
        }
      }

      // 1. ⚡ עדכון מיידי בRedis with populated data
      // ✅ חייבים toObject() כי MongoDB Document לא JSON
      const cartForRedis = (populatedCart as any).toObject
        ? (populatedCart as any).toObject()
        : populatedCart;
      await this.safeCacheSet(`cart:${cartId}`, this.CACHE_TTL, cartForRedis);
      log.debug(
        "CartService",
        `Cart updated in Redis with populated products: ${cartId}`,
      );

      // 2. ⏰ תזמון שמירה למונגו (לא חוסם!)
      this.scheduleMongoSave(cartId, populatedCart);
    } catch (error) {
      logger.error({ error }, "❌ Error updating cart cache");
      throw error;
    }
  }

  // Add item to cart - ⚡ גרסה מהירה וחכמה
  static async addToCart(
    productId: string,
    quantity: number,
    userId: string,
  ): Promise<ICart> {
    const t = track("CartService", "addToCart");

    try {
      const cartId = `user:${userId}`;

      // ✅ בדוק מוצר ומלאי (חייב להיות מדויק)
      const product = await ProductModel.findById(productId);
      if (!product) {
        throw new ApiError(404, "Product not found", undefined, "NOT_FOUND");
      }

      if (product.stock < quantity) {
        throw new ApiError(
          400,
          "Insufficient stock",
          undefined,
          "VALIDATION_ERROR",
        );
      }

      // ⚡ קבל עגלה נוכחית (מהיר מRedis)
      let cart = await this.getCart(userId);

      // צור עגלה חדשה אם לא קיימת
      let isNewCart = false;
      if (!cart) {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        cart = new CartModel({
          userId: userObjectId,
          items: [],
          total: 0,
        });
        isNewCart = true;
        logger.info(`🆕 Created new cart: ${cartId}`);
      }

      // חפש פריט קיים - תמיכה בפורמטים שונים (ObjectId, string, populated object)
      const existingItemIndex = cart.items.findIndex((item: ICartItem) => {
        const itemProductId =
          typeof item.product === "string"
            ? item.product
            : (item.product as any)?._id?.toString() ||
              (item.product as any)?.toString();
        return itemProductId === productId;
      });

      if (existingItemIndex >= 0) {
        // עדכן כמות קיימת
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;

        // בדוק מלאי כולל
        if (product.stock < newQuantity) {
          throw new ApiError(
            400,
            `Insufficient stock. Available: ${product.stock}, Requested: ${newQuantity}`,
            undefined,
            "VALIDATION_ERROR",
          );
        }

        cart.items[existingItemIndex].quantity = newQuantity;
        logger.info(`📈 Updated quantity for ${product.name}: ${newQuantity}`);
      } else {
        // הוסף פריט חדש (ללא price - משתמש בחנות)
        cart.items.push({
          product: productId as any,
          quantity,
          lockedPrice: null, // null = משתמש בחנות
        });
        logger.info(`➕ Added new item: ${product.name} x${quantity}`);
      }

      // חשב מחדש סכום כולל
      cart.total = cart.items.reduce((sum: number, item: ICartItem) => {
        const itemProduct =
          typeof item.product === "string" ? product : (item.product as any);

        const price = item.lockedPrice ?? (itemProduct?.price || product.price);
        return sum + price * item.quantity;
      }, 0);
      cart.updatedAt = new Date();

      // 🔥 שמור את העגלה ב-MongoDB לפני populate
      // חייבים לעדכן בכל מקרה (חדשה או קיימת)
      const cartToSave = isNewCart
        ? (cart as any)
        : await CartModel.findOneAndUpdate(
            { userId },
            {
              $set: {
                items: cart.items,
                total: cart.total,
                updatedAt: cart.updatedAt,
              },
            },
            { new: true, upsert: true },
          );

      if (isNewCart) {
        await (cart as any).save();
        logger.info(`💾 Saved new cart to MongoDB: ${cartId}`);
      } else {
        logger.info(`💾 Updated existing cart in MongoDB: ${cartId}`);
      }

      // ✅ Populate המוצרים לפני עדכון cache והחזרה
      const populatedCart = await CartModel.findOne({ userId }).populate(
        "items.product",
      );

      if (!populatedCart) {
        // 🚨 אם עדיין לא מצאנו, populate ידנית
        logger.warn(
          `⚠️ Cart not found after save, using direct populate: ${cartId}`,
        );

        // אם cart הוא mongoose document, populate ישירות
        if (cart instanceof CartModel) {
          await cart.populate("items.product");
          const cartObj = (cart as any).toObject();
          await this.safeCacheSet(`cart:${cartId}`, this.CACHE_TTL, cartObj);
          t.success(cartObj);
          return cartObj;
        }

        // Fallback: החזר מה שיש (לא אמור לקרות)
        logger.error(`❌ Failed to populate cart: ${cartId}`);
        t.success(cart);
        return cart;
      }

      // ✅ עדכן Redis ותזמון MongoDB עם ה-populated version
      const cartObj = populatedCart.toObject();
      await this.safeCacheSet(`cart:${cartId}`, this.CACHE_TTL, cartObj);
      logger.info(
        `✅ Cart updated in Redis with ${cartObj.items.length} items: ${cartId}`,
      );

      // תזמון שמירה למונגו
      this.scheduleMongoSave(cartId, populatedCart);

      t.success(cartObj);
      return cartObj;
    } catch (error) {
      t.error(error);
      throw error;
    }
  }

  // Remove item from cart - ⚡ גרסה מהירה
  static async removeFromCart(
    productId: string,
    userId: string,
  ): Promise<ICart | null> {
    const t = track("CartService", "removeFromCart");

    try {
      const cartId = `user:${userId}`;

      // ⚡ קבל עגלה נוכחית (מהיר מRedis)
      const cart = await this.getCart(userId);

      if (!cart) {
        logger.info(`❌ Cart not found: ${cartId}`);
        return null;
      }

      // מצא פריט למחיקה - תמיכה בפורמטים שונים
      const itemToRemove = cart.items.find((item: ICartItem) => {
        const itemProductId =
          typeof item.product === "string"
            ? item.product
            : (item.product as any)?._id?.toString() ||
              (item.product as any)?.toString();
        return itemProductId === productId;
      });

      if (!itemToRemove) {
        logger.info(`❌ Item not found in cart: ${productId}`);
        return cart;
      }

      // הסר פריט
      (cart.items as any) = cart.items.filter((item: ICartItem) => {
        const itemProductId =
          typeof item.product === "string"
            ? item.product
            : (item.product as any)?._id?.toString() ||
              (item.product as any)?.toString();
        return itemProductId !== productId;
      });

      // חשב מחדש סכום ושמור
      cart.total = cart.items.reduce((sum: number, item: ICartItem) => {
        const itemProduct =
          typeof item.product === "string" ? undefined : (item.product as any);
        const price = item.lockedPrice ?? (itemProduct?.price || 0);
        return sum + price * item.quantity;
      }, 0);
      cart.updatedAt = new Date();

      // 🔥 עדכן את העגלה ב-MongoDB בכל מקרה
      await CartModel.findOneAndUpdate(
        { userId },
        {
          $set: {
            items: cart.items,
            total: cart.total,
            updatedAt: cart.updatedAt,
          },
        },
        { new: true, upsert: true },
      );
      logger.info(`💾 Updated removal in MongoDB: ${cartId}`);

      // ✅ Populate and cache עם דרך נכונה
      const populatedCart = await CartModel.findOne({ userId }).populate(
        "items.product",
      );

      if (populatedCart) {
        const cartObj = populatedCart.toObject();
        await this.safeCacheSet(`cart:${cartId}`, this.CACHE_TTL, cartObj);
        logger.info(`✅ Item removed from cart: ${productId}`);

        // תזמון שמירה למונגו
        this.scheduleMongoSave(cartId, populatedCart);
        t.success(cartObj);
        return cartObj;
      }

      // Fallback: populate ידני אם לא מצאנו ב-MongoDB
      if (cart instanceof CartModel) {
        await cart.populate("items.product");
        const cartObj = (cart as any).toObject();
        await this.safeCacheSet(`cart:${cartId}`, this.CACHE_TTL, cartObj);
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
    userId: string,
  ): Promise<ICart | null> {
    const t = track("CartService", "updateQuantity");
    logger.info(`6📝 Updating quantity: ${productId} to ${quantity}`);

    // אם כמות 0 או פחות - מחק פריט
    if (quantity <= 0) {
      return this.removeFromCart(productId, userId);
    }

    const cartId = `user:${userId}`;

    try {
      logger.info(
        `📝 Updating quantity: ${productId} to ${quantity} for ${cartId}`,
      );

      // ⚡ קבל עגלה נוכחית (מהיר מRedis)
      const cart = await this.getCart(userId);

      if (!cart) {
        logger.info(`❌ Cart not found: ${cartId}`);
        return null;
      }

      // מצא פריט לעדכון - תמיכה בפורמטים שונים
      const itemIndex = cart.items.findIndex((item: ICartItem) => {
        const itemProductId =
          typeof item.product === "string"
            ? item.product
            : (item.product as any)?._id?.toString() ||
              (item.product as any)?.toString();
        return itemProductId === productId;
      });

      if (itemIndex < 0) {
        logger.info(`❌ Item not found in cart: ${productId}`);
        return cart;
      }

      // ✅ בדוק מלאי (חייב להיות מדויק)
      const product = await ProductModel.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      if (product.stock < quantity) {
        throw new Error(
          `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`,
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

      // 🔥 עדכן את העגלה ב-MongoDB בכל מקרה
      await CartModel.findOneAndUpdate(
        { userId },
        {
          $set: {
            items: cart.items,
            total: cart.total,
            updatedAt: cart.updatedAt,
          },
        },
        { new: true, upsert: true },
      );
      logger.info(`💾 Updated quantity in MongoDB: ${cartId}`);

      // ✅ Populate and cache בצורה נכונה
      const populatedCart = await CartModel.findOne({ userId }).populate(
        "items.product",
      );

      if (populatedCart) {
        const cartObj = populatedCart.toObject();
        await this.safeCacheSet(`cart:${cartId}`, this.CACHE_TTL, cartObj);
        logger.info(`✅ Quantity updated: ${product?.name} x${quantity}`);

        // תזמון שמירה למונגו
        this.scheduleMongoSave(cartId, populatedCart);
        t.success(cartObj);
        return cartObj;
      }

      // Fallback: populate ידני אם לא מצאנו ב-MongoDB
      if (cart instanceof CartModel) {
        await cart.populate("items.product");
        const cartObj = (cart as any).toObject();
        await this.safeCacheSet(`cart:${cartId}`, this.CACHE_TTL, cartObj);
        t.success(cartObj);
        return cartObj;
      }

      t.success(cart);
      return cart;
    } catch (error) {
      t.error(error);
      logger.error(
        { error, cartId },
        `❌ Error updating quantity for ${cartId}`,
      );
      throw error;
    }
  }

  // Clear cart - עם ביטול שמירות ממתינות
  static async clearCart(userId: string): Promise<boolean> {
    const cartId = `user:${userId}`;

    try {
      logger.info(`🗑️ Clearing cart: ${cartId}`);

      // ביטול שמירה ממתינה אם יש
      const pendingSave = this.pendingSaves.get(cartId);
      if (pendingSave) {
        clearTimeout(pendingSave);
        this.pendingSaves.delete(cartId);
        logger.info(`⏰ Cancelled pending save for: ${cartId}`);
      }

      // מחק מRedis (מהיר)
      await this.safeCacheDel(`cart:${cartId}`);
      logger.info(`⚡ Cleared from Redis: ${cartId}`);

      // מחק ממונגו (יכול להיות איטי, אבל לא חוסם)
      CartModel.deleteOne({ userId })
        .exec()
        .then(() => {
          logger.info(`💾 Cleared from MongoDB: ${cartId}`);
        })
        .catch((error: any) => {
          logger.error(
            { error, cartId },
            `❌ MongoDB delete failed for ${cartId}`,
          );
        });

      return true;
    } catch (error) {
      logger.error({ error, cartId }, `❌ Error clearing cart ${cartId}`);
      return false;
    }
  }

  // 🧹 פונקציה לניקוי כל הsaves הממתינים (לטסטים או shutdown)
  static async flushPendingSaves(): Promise<void> {
    logger.info(`🧹 Flushing ${this.pendingSaves.size} pending saves...`);

    for (const [cartId, timer] of this.pendingSaves.entries()) {
      clearTimeout(timer);
    }

    this.pendingSaves.clear();
    logger.info("✅ All pending saves cleared");
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
