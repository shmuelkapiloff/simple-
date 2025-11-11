# 🛠️ דוגמאות קוד מעשיות - עגלת קניות
*קוד מוכן לעותק-הדבק עם הסברים*

---

## 🏗️ **Backend Implementation**

### **Cart Service - המנוע המרכזי**

```typescript
// server/src/services/cart.service.ts
import { CartModel, ICart, ICartItem } from "../models/cart.model";
import { ProductModel } from "../models/product.model";
import { redis as redisClient } from "../config/redisClient";

export class CartService {
  // הגדרות זמנים
  private static readonly CACHE_TTL = {
    GUEST: 3600,      // 1 שעה לאורח
    USER: 2592000,    // 30 יום למשתמש מחובר
    ABANDONED: 7776000 // 90 יום לעגלות נטושות
  };

  private static readonly SAVE_DELAY = 5000; // 5 שניות debounce
  private static pendingSaves = new Map<string, NodeJS.Timeout>();

  /**
   * קבלת עגלה - Redis קודם, MongoDB אחר כך
   */
  static async getCart(sessionId: string, userId?: string): Promise<ICart | null> {
    const cartId = userId ? `user:${userId}` : `guest:${sessionId}`;
    const ttl = userId ? this.CACHE_TTL.USER : this.CACHE_TTL.GUEST;
    
    console.log(`🔍 Fetching cart: ${cartId}`);

    try {
      // ⚡ נסה Redis קודם
      const redisCart = await redisClient.get(`cart:${cartId}`);
      if (redisCart) {
        const parsedCart = JSON.parse(redisCart);
        
        // רענן TTL
        await redisClient.expire(`cart:${cartId}`, ttl);
        console.log(`✅ Cart loaded from Redis: ${cartId}`);
        
        return parsedCart;
      }

      // 💾 Fallback למונגו
      console.log(`🔍 Cart not in Redis, checking MongoDB: ${cartId}`);
      
      const dbCart = await CartModel.findOne({
        $or: [{ sessionId: sessionId }, { userId: userId }],
      }).populate("items.product", "name price image sku stock");

      if (dbCart) {
        // שמור ב-Redis לפעמים הבאות
        await redisClient.setex(`cart:${cartId}`, ttl, JSON.stringify(dbCart));
        console.log(`📥 Cart cached in Redis from MongoDB: ${cartId}`);
        return dbCart;
      }

      console.log(`❌ No cart found: ${cartId}`);
      return null;

    } catch (error) {
      console.error("❌ Error getting cart:", error);
      
      // אם Redis נפל, נסה רק מונגו
      if ((error as Error).message?.includes("Redis")) {
        try {
          return await CartModel.findOne({
            $or: [{ sessionId: sessionId }, { userId: userId }],
          }).populate("items.product");
        } catch (mongoError) {
          console.error("💥 Both Redis and MongoDB failed:", mongoError);
        }
      }

      return null;
    }
  }

  /**
   * הוספת מוצר לעגלה
   */
  static async addToCart(
    sessionId: string,
    productId: string,
    quantity: number,
    userId?: string
  ): Promise<ICart> {
    const cartId = userId ? `user:${userId}` : `guest:${sessionId}`;
    console.log(`🛒 Adding to cart: ${productId} x${quantity} for ${cartId}`);

    try {
      // בדיקת מוצר ומלאי
      const product = await ProductModel.findById(productId);
      if (!product) throw new Error("Product not found");
      if (product.stock < quantity) throw new Error("Insufficient stock");

      // קבלת עגלה נוכחית
      let cart = await this.getCart(sessionId, userId);

      // יצירת עגלה חדשה אם לא קיימת
      if (!cart) {
        cart = new CartModel({
          sessionId,
          userId,
          items: [],
          total: 0,
        });
        console.log(`🆕 Created new cart: ${cartId}`);
      }

      // עדכון עגלה
      const existingItemIndex = cart.items.findIndex(
        (item: ICartItem) => item.product._id.toString() === productId
      );

      if (existingItemIndex >= 0) {
        // עדכון כמות קיימת
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        
        if (product.stock < newQuantity) {
          throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${newQuantity}`);
        }

        cart.items[existingItemIndex].quantity = newQuantity;
        console.log(`📈 Updated quantity for ${product.name}: ${newQuantity}`);
      } else {
        // הוספת מוצר חדש
        cart.items.push({
          product: productId as any,
          quantity,
          price: product.price,
        });
        console.log(`➕ Added new item: ${product.name} x${quantity}`);
      }

      // חישוב מחדש של סכום
      cart.total = cart.items.reduce(
        (sum: number, item: ICartItem) => sum + item.price * item.quantity,
        0
      );
      cart.updatedAt = new Date();

      // עדכון מיידי ב-Redis + תזמון למונגו
      await this.updateCartInCache(cartId, cart);

      console.log(`✅ Cart updated successfully: ${cartId}, Total: $${cart.total}`);
      return cart;

    } catch (error) {
      console.error(`❌ Error adding to cart ${cartId}:`, error);
      throw error;
    }
  }

  /**
   * עדכון כמות מוצר
   */
  static async updateQuantity(
    sessionId: string,
    productId: string,
    quantity: number,
    userId?: string
  ): Promise<ICart | null> {
    
    // אם כמות 0 או פחות - מחק מוצר
    if (quantity <= 0) {
      return this.removeFromCart(sessionId, productId, userId);
    }

    const cartId = userId ? `user:${userId}` : `guest:${sessionId}`;

    try {
      console.log(`📝 Updating quantity: ${productId} to ${quantity} for ${cartId}`);

      const cart = await this.getCart(sessionId, userId);
      if (!cart) {
        console.log(`❌ Cart not found: ${cartId}`);
        return null;
      }

      // מציאת מוצר
      const itemIndex = cart.items.findIndex(
        (item: ICartItem) => item.product._id.toString() === productId
      );

      if (itemIndex < 0) {
        console.log(`❌ Item not found in cart: ${productId}`);
        return cart;
      }

      // בדיקת מלאי
      const product = await ProductModel.findById(productId);
      if (!product) throw new Error("Product not found");
      if (product.stock < quantity) {
        throw new Error(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`);
      }

      // עדכון כמות
      cart.items[itemIndex].quantity = quantity;

      // חישוב מחדש של סכום
      cart.total = cart.items.reduce(
        (sum: number, item: ICartItem) => sum + item.price * item.quantity,
        0
      );
      cart.updatedAt = new Date();

      // עדכון ב-cache
      await this.updateCartInCache(cartId, cart);

      console.log(`✅ Quantity updated: ${product.name} x${quantity}`);
      return cart;

    } catch (error) {
      console.error(`❌ Error updating quantity for ${cartId}:`, error);
      throw error;
    }
  }

  /**
   * הסרת מוצר מעגלה
   */
  static async removeFromCart(
    sessionId: string,
    productId: string,
    userId?: string
  ): Promise<ICart | null> {
    const cartId = userId ? `user:${userId}` : `guest:${sessionId}`;
    
    try {
      console.log(`🗑️ Removing from cart: ${productId} for ${cartId}`);

      const cart = await this.getCart(sessionId, userId);
      if (!cart) {
        console.log(`❌ Cart not found: ${cartId}`);
        return null;
      }

      // הסרת מוצר
      const originalLength = cart.items.length;
      cart.items = cart.items.filter(
        (item: ICartItem) => item.product._id.toString() !== productId
      );

      if (cart.items.length === originalLength) {
        console.log(`❌ Item not found in cart: ${productId}`);
        return cart;
      }

      // חישוב מחדש של סכום
      cart.total = cart.items.reduce(
        (sum: number, item: ICartItem) => sum + item.price * item.quantity,
        0
      );
      cart.updatedAt = new Date();

      // עדכון ב-cache
      await this.updateCartInCache(cartId, cart);

      console.log(`✅ Item removed successfully: ${productId}`);
      return cart;

    } catch (error) {
      console.error(`❌ Error removing from cart ${cartId}:`, error);
      throw error;
    }
  }

  /**
   * ניקוי עגלה
   */
  static async clearCart(sessionId: string, userId?: string): Promise<boolean> {
    const cartId = userId ? `user:${userId}` : `guest:${sessionId}`;
    
    try {
      console.log(`🗑️ Clearing cart: ${cartId}`);

      // ביטול שמירה ממתינה
      const pendingSave = this.pendingSaves.get(cartId);
      if (pendingSave) {
        clearTimeout(pendingSave);
        this.pendingSaves.delete(cartId);
        console.log(`⏰ Cancelled pending save for: ${cartId}`);
      }

      // מחיקה מ-Redis
      await redisClient.del(`cart:${cartId}`);
      console.log(`⚡ Cleared from Redis: ${cartId}`);

      // מחיקה מ-MongoDB (async)
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

  /**
   * עדכון מהיר ב-Redis + תזמון למונגו
   */
  private static async updateCartInCache(cartId: string, cart: ICart): Promise<void> {
    try {
      const ttl = cart.userId ? this.CACHE_TTL.USER : this.CACHE_TTL.GUEST;
      
      // עדכון מיידי ב-Redis
      await redisClient.setex(`cart:${cartId}`, ttl, JSON.stringify(cart));
      console.log(`⚡ Cart updated in Redis: ${cartId}`);

      // תזמון שמירה למונגו
      this.scheduleMongoSave(cartId, cart);

    } catch (error) {
      console.error("❌ Error updating cart cache:", error);
      throw error;
    }
  }

  /**
   * תזמון חכם לשמירה במונגו (Debounce)
   */
  private static scheduleMongoSave(cartId: string, cart: ICart): void {
    // ביטול timer קודם
    const existingTimer = this.pendingSaves.get(cartId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // יצירת timer חדש
    const timer = setTimeout(async () => {
      try {
        console.log(`💾 Saving to MongoDB: ${cartId}`);

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

  /**
   * מיזוג עגלת אורח לעגלת משתמש
   */
  static async mergeGuestCartToUser(sessionId: string, userId: string): Promise<ICart> {
    console.log(`🔄 Merging guest cart ${sessionId} to user ${userId}`);

    const guestCart = await this.getCart(sessionId);
    const userCart = await this.getCart(null, userId);

    if (!guestCart) {
      return userCart || new CartModel({ userId, items: [], total: 0 });
    }

    if (!userCart) {
      // העברה פשוטה
      guestCart.userId = userId;
      guestCart.sessionId = undefined;
      
      await redisClient.setex(`cart:user:${userId}`, this.CACHE_TTL.USER, JSON.stringify(guestCart));
      await redisClient.del(`cart:guest:${sessionId}`);
      
      this.scheduleMongoSave(`user:${userId}`, guestCart);
      return guestCart;
    }

    // מיזוג מורכב
    const mergedCart = await this.mergeCarts(userCart, guestCart);
    mergedCart.userId = userId;
    
    await redisClient.setex(`cart:user:${userId}`, this.CACHE_TTL.USER, JSON.stringify(mergedCart));
    await redisClient.del(`cart:guest:${sessionId}`);
    
    this.scheduleMongoSave(`user:${userId}`, mergedCart);
    
    console.log(`✅ Carts merged successfully for user ${userId}`);
    return mergedCart;
  }

  /**
   * מיזוג שתי עגלות
   */
  private static mergeCarts(userCart: ICart, guestCart: ICart): ICart {
    console.log(`🤝 Merging carts: ${userCart.items.length} + ${guestCart.items.length} items`);

    const merged = { ...userCart };
    
    for (const guestItem of guestCart.items) {
      const existingItem = merged.items.find(
        item => item.product._id.toString() === guestItem.product._id.toString()
      );
      
      if (existingItem) {
        // מיזוג כמויות - קח את הגבוה יותר
        existingItem.quantity = Math.max(existingItem.quantity, guestItem.quantity);
        console.log(`🔄 Merged quantities for product ${guestItem.product._id}: ${existingItem.quantity}`);
      } else {
        // הוספת מוצר חדש
        merged.items.push(guestItem);
        console.log(`➕ Added new item from guest cart: ${guestItem.product._id}`);
      }
    }
    
    // חישוב מחדש של סכום
    merged.total = merged.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    return merged;
  }

  /**
   * ניקוי כל השמירות הממתינות
   */
  static flushPendingSaves(): void {
    console.log(`🧹 Flushing ${this.pendingSaves.size} pending saves...`);

    for (const [cartId, timer] of this.pendingSaves.entries()) {
      clearTimeout(timer);
    }

    this.pendingSaves.clear();
    console.log("✅ All pending saves cleared");
  }
}
```

---

## 🎮 **Cart Controller - ממשק ה-API**

```typescript
// server/src/controllers/cart.controller.ts
import { Request, Response } from "express";
import { CartService } from "../services/cart.service";
import { ApiResponse } from "../utils/response";

export class CartController {
  /**
   * GET /api/cart - קבלת עגלה
   */
  static async getCart(req: Request, res: Response) {
    try {
      const { sessionId } = req.query;
      const userId = req.user?.id; // מ-JWT middleware

      if (!sessionId && !userId) {
        return res.status(400).json(
          ApiResponse.error("Session ID or User ID required")
        );
      }

      const cart = await CartService.getCart(sessionId as string, userId);
      
      if (!cart) {
        return res.status(404).json(
          ApiResponse.error("Cart not found")
        );
      }

      res.json(ApiResponse.success(cart, "Cart retrieved successfully"));

    } catch (error) {
      console.error("❌ Error getting cart:", error);
      res.status(500).json(
        ApiResponse.error("Failed to get cart")
      );
    }
  }

  /**
   * POST /api/cart/add - הוספת מוצר לעגלה
   */
  static async addToCart(req: Request, res: Response) {
    try {
      const { sessionId, productId, quantity = 1 } = req.body;
      const userId = req.user?.id;

      // וולידציה
      if (!sessionId && !userId) {
        return res.status(400).json(
          ApiResponse.error("Session ID or User ID required")
        );
      }

      if (!productId) {
        return res.status(400).json(
          ApiResponse.error("Product ID required")
        );
      }

      if (quantity <= 0) {
        return res.status(400).json(
          ApiResponse.error("Quantity must be positive")
        );
      }

      const updatedCart = await CartService.addToCart(
        sessionId,
        productId,
        quantity,
        userId
      );

      res.status(201).json(
        ApiResponse.success(updatedCart, "Item added to cart successfully")
      );

    } catch (error: any) {
      console.error("❌ Error adding to cart:", error);

      if (error.message?.includes("not found")) {
        return res.status(404).json(ApiResponse.error(error.message));
      }

      if (error.message?.includes("stock")) {
        return res.status(400).json(ApiResponse.error(error.message));
      }

      res.status(500).json(
        ApiResponse.error("Failed to add item to cart")
      );
    }
  }

  /**
   * PUT /api/cart/update - עדכון כמות
   */
  static async updateQuantity(req: Request, res: Response) {
    try {
      const { sessionId, productId, quantity } = req.body;
      const userId = req.user?.id;

      // וולידציה
      if (!sessionId && !userId) {
        return res.status(400).json(
          ApiResponse.error("Session ID or User ID required")
        );
      }

      if (!productId) {
        return res.status(400).json(
          ApiResponse.error("Product ID required")
        );
      }

      if (typeof quantity !== 'number' || quantity < 0) {
        return res.status(400).json(
          ApiResponse.error("Valid quantity required")
        );
      }

      const updatedCart = await CartService.updateQuantity(
        sessionId,
        productId,
        quantity,
        userId
      );

      if (!updatedCart) {
        return res.status(404).json(
          ApiResponse.error("Cart not found")
        );
      }

      res.json(
        ApiResponse.success(updatedCart, "Cart updated successfully")
      );

    } catch (error: any) {
      console.error("❌ Error updating cart:", error);

      if (error.message?.includes("stock")) {
        return res.status(400).json(ApiResponse.error(error.message));
      }

      res.status(500).json(
        ApiResponse.error("Failed to update cart")
      );
    }
  }

  /**
   * DELETE /api/cart/remove - הסרת מוצר
   */
  static async removeFromCart(req: Request, res: Response) {
    try {
      const { sessionId, productId } = req.body;
      const userId = req.user?.id;

      // וולידציה
      if (!sessionId && !userId) {
        return res.status(400).json(
          ApiResponse.error("Session ID or User ID required")
        );
      }

      if (!productId) {
        return res.status(400).json(
          ApiResponse.error("Product ID required")
        );
      }

      const updatedCart = await CartService.removeFromCart(
        sessionId,
        productId,
        userId
      );

      if (!updatedCart) {
        return res.status(404).json(
          ApiResponse.error("Cart not found")
        );
      }

      res.json(
        ApiResponse.success(updatedCart, "Item removed from cart successfully")
      );

    } catch (error) {
      console.error("❌ Error removing from cart:", error);
      res.status(500).json(
        ApiResponse.error("Failed to remove item from cart")
      );
    }
  }

  /**
   * DELETE /api/cart/clear - ניקוי עגלה
   */
  static async clearCart(req: Request, res: Response) {
    try {
      const { sessionId } = req.body;
      const userId = req.user?.id;

      // וולידציה
      if (!sessionId && !userId) {
        return res.status(400).json(
          ApiResponse.error("Session ID or User ID required")
        );
      }

      const success = await CartService.clearCart(sessionId, userId);

      if (!success) {
        return res.status(500).json(
          ApiResponse.error("Failed to clear cart")
        );
      }

      res.json(
        ApiResponse.success(null, "Cart cleared successfully")
      );

    } catch (error) {
      console.error("❌ Error clearing cart:", error);
      res.status(500).json(
        ApiResponse.error("Failed to clear cart")
      );
    }
  }

  /**
   * GET /api/cart/count - ספירת פריטים בעגלה
   */
  static async getCartCount(req: Request, res: Response) {
    try {
      const { sessionId } = req.query;
      const userId = req.user?.id;

      const cart = await CartService.getCart(sessionId as string, userId);
      
      const count = cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

      res.json(
        ApiResponse.success({ count }, "Cart count retrieved successfully")
      );

    } catch (error) {
      console.error("❌ Error getting cart count:", error);
      res.status(500).json(
        ApiResponse.error("Failed to get cart count")
      );
    }
  }

  /**
   * POST /api/cart/merge - מיזוג עגלת אורח לעגלת משתמש
   */
  static async mergeGuestCart(req: Request, res: Response) {
    try {
      const { sessionId } = req.body;
      const userId = req.user?.id;

      if (!sessionId || !userId) {
        return res.status(400).json(
          ApiResponse.error("Session ID and User ID required for merge")
        );
      }

      const mergedCart = await CartService.mergeGuestCartToUser(sessionId, userId);

      res.json(
        ApiResponse.success(mergedCart, "Carts merged successfully")
      );

    } catch (error) {
      console.error("❌ Error merging carts:", error);
      res.status(500).json(
        ApiResponse.error("Failed to merge carts")
      );
    }
  }
}
```

---

## 🛤️ **Cart Routes**

```typescript
// server/src/routes/cart.routes.ts
import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import { optionalAuth } from "../middlewares/auth.middleware";

const router = Router();

// Optional auth - עובד גם לאורח וגם למשתמש מחובר
router.use(optionalAuth);

// GET /api/cart - קבלת עגלה
router.get("/", CartController.getCart);

// GET /api/cart/count - ספירת פריטים
router.get("/count", CartController.getCartCount);

// POST /api/cart/add - הוספת מוצר
router.post("/add", CartController.addToCart);

// PUT /api/cart/update - עדכון כמות
router.put("/update", CartController.updateQuantity);

// DELETE /api/cart/remove - הסרת מוצר
router.delete("/remove", CartController.removeFromCart);

// DELETE /api/cart/clear - ניקוי עגלה
router.delete("/clear", CartController.clearCart);

// POST /api/cart/merge - מיזוג עגלות
router.post("/merge", CartController.mergeGuestCart);

export default router;
```

---

## ⚛️ **Frontend Implementation**

### **Redux Cart Slice עם Session Management**

```typescript
// client/src/app/cartSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Types
export interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    image: string;
    sku: string;
  };
  quantity: number;
  price: number;
}

export interface CartState {
  sessionId: string | null;
  items: CartItem[];
  total: number;
  itemCount: number;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: CartState = {
  sessionId: null,
  items: [],
  total: 0,
  itemCount: 0,
  loading: false,
  error: null,
};

// Helper functions
const generateSessionId = (): string => {
  // נסה לטעון sessionId קיים מ-localStorage
  const existingSessionId = localStorage.getItem('cart-session-id');
  
  if (existingSessionId) {
    console.log('🔄 Using existing session ID:', existingSessionId);
    return existingSessionId;
  }
  
  // צור sessionId חדש
  const newSessionId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // שמור ב-localStorage לעתיד
  localStorage.setItem('cart-session-id', newSessionId);
  console.log('🆕 Created new session ID:', newSessionId);
  
  return newSessionId;
};

const calculateTotals = (items: CartItem[]) => {
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { total, itemCount };
};

// Cart Slice
export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // אתחול עגלה עם session ID
    initializeCart: (state) => {
      if (!state.sessionId) {
        state.sessionId = generateSessionId();
        console.log("🆕 Cart initialized with sessionId:", state.sessionId);
      }
    },

    // עדכון עגלה מהשרת
    setCart: (
      state,
      action: PayloadAction<{
        items: CartItem[];
        total: number;
        sessionId?: string;
      }>
    ) => {
      const { items, total, sessionId } = action.payload;
      state.items = items;
      state.total = total;
      if (sessionId) state.sessionId = sessionId;

      const { itemCount } = calculateTotals(items);
      state.itemCount = itemCount;
      state.error = null;

      console.log("📥 Cart set:", { itemCount, total, sessionId });
    },

    // הוספת מוצר אופטימיסטית (לפני קריאה לשרת)
    addItemOptimistic: (
      state,
      action: PayloadAction<{
        productId: string;
        quantity: number;
        product: any;
      }>
    ) => {
      const { productId, quantity, product } = action.payload;

      // בדוק אם מוצר כבר קיים
      const existingItem = state.items.find(
        (item) => item.product._id === productId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          _id: `temp-${Date.now()}`,
          product: {
            _id: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            sku: product.sku,
          },
          quantity,
          price: product.price,
        });
      }

      // חישוב מחדש של סכומים
      const { total, itemCount } = calculateTotals(state.items);
      state.total = total;
      state.itemCount = itemCount;

      console.log("➕ Item added optimistically:", {
        productId,
        quantity,
        itemCount,
      });
    },

    // עדכון כמות אופטימיסטי
    updateQuantityOptimistic: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) => {
      const { productId, quantity } = action.payload;

      if (quantity <= 0) {
        state.items = state.items.filter(
          (item) => item.product._id !== productId
        );
      } else {
        const existingItem = state.items.find(
          (item) => item.product._id === productId
        );
        if (existingItem) {
          existingItem.quantity = quantity;
        }
      }

      // חישוב מחדש של סכומים
      const { total, itemCount } = calculateTotals(state.items);
      state.total = total;
      state.itemCount = itemCount;

      console.log("📝 Quantity updated optimistically:", {
        productId,
        quantity,
        itemCount,
      });
    },

    // הסרת מוצר אופטימיסטית
    removeItemOptimistic: (
      state,
      action: PayloadAction<{ productId: string }>
    ) => {
      const { productId } = action.payload;

      state.items = state.items.filter(
        (item) => item.product._id !== productId
      );

      // חישוב מחדש של סכומים
      const { total, itemCount } = calculateTotals(state.items);
      state.total = total;
      state.itemCount = itemCount;

      console.log("🗑️ Item removed optimistically:", { productId, itemCount });
    },

    // ניקוי עגלה
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
      state.error = null;
      
      // נקה גם sessionId מ-localStorage
      if (state.sessionId) {
        localStorage.removeItem('cart-session-id');
        console.log('🧹 Cart cleared and session ID removed from storage');
      }

      console.log("🧹 Cart cleared");
    },

    // עדכון מצב טעינה
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // עדכון מצב שגיאה
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    // החזרה ממצב אופטימיסטי (אם השרת נכשל)
    revertOptimisticUpdate: (
      state,
      action: PayloadAction<{ items: CartItem[]; total: number }>
    ) => {
      const { items, total } = action.payload;
      state.items = items;
      state.total = total;

      const { itemCount } = calculateTotals(items);
      state.itemCount = itemCount;

      console.log("↩️ Optimistic update reverted");
    },
    
    // פונקציית debug - איפוס sessionId
    resetSessionId: (state) => {
      localStorage.removeItem('cart-session-id');
      state.sessionId = null;
      console.log("🔧 Session ID reset - next initializeCart will create new one");
    },
  },
});

// Export actions
export const {
  initializeCart,
  setCart,
  addItemOptimistic,
  updateQuantityOptimistic,
  removeItemOptimistic,
  clearCart,
  setLoading,
  setError,
  revertOptimisticUpdate,
  resetSessionId,
} = cartSlice.actions;

// Selectors
export const selectCart = (state: { cart: CartState }) => state.cart;
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartTotal = (state: { cart: CartState }) => state.cart.total;
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.itemCount;
export const selectCartLoading = (state: { cart: CartState }) =>
  state.cart.loading;
export const selectCartError = (state: { cart: CartState }) => state.cart.error;
export const selectSessionId = (state: { cart: CartState }) =>
  state.cart.sessionId;

// Helper selectors
export const selectIsInCart = (state: { cart: CartState }, productId: string) =>
  state.cart.items.some((item) => item.product._id === productId);

export const selectProductQuantity = (
  state: { cart: CartState },
  productId: string
) =>
  state.cart.items.find((item) => item.product._id === productId)?.quantity ||
  0;

export default cartSlice.reducer;
```

---

## 🎯 **דוגמת שימוש ברכיב React**

```typescript
// client/src/components/ProductCard.tsx
import { useSelector, useDispatch } from "react-redux";
import {
  selectSessionId,
  selectIsInCart,
  selectProductQuantity,
  initializeCart,
  addItemOptimistic,
  setError,
} from "../app/cartSlice";
import { useAddToCartMutation } from "../app/api";
import { useEffect } from "react";

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    price: number;
    image: string;
    sku: string;
    stock: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const dispatch = useDispatch();
  const sessionId = useSelector(selectSessionId);
  const isInCart = useSelector((state) => selectIsInCart(state, product._id));
  const quantity = useSelector((state) => selectProductQuantity(state, product._id));
  
  const [addToCartMutation, { isLoading: isAddingToCart }] = useAddToCartMutation();

  // וודא שיש session ID
  useEffect(() => {
    if (!sessionId) {
      dispatch(initializeCart());
    }
  }, [dispatch, sessionId]);

  const handleAddToCart = async () => {
    if (!sessionId) {
      dispatch(setError("Session not initialized"));
      return;
    }

    if (product.stock <= 0) {
      dispatch(setError("Product is out of stock"));
      return;
    }

    try {
      // 1. עדכון אופטימיסטי מיידי
      dispatch(
        addItemOptimistic({
          productId: product._id,
          quantity: 1,
          product: {
            _id: product._id,
            name: product.name,
            price: product.price,
            image: product.image,
            sku: product.sku,
          },
        })
      );

      // 2. שליחה לשרת
      await addToCartMutation({
        sessionId,
        productId: product._id,
        quantity: 1,
      }).unwrap();

      console.log(`✅ Added ${product.name} to cart`);

    } catch (error: any) {
      console.error("Add to cart failed:", error);
      dispatch(setError("Failed to add item to cart"));
      
      // TODO: החזרה ממצב אופטימיסטי אם השרת נכשל
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-48 object-cover rounded mb-4"
      />
      
      <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
      
      <div className="flex justify-between items-center">
        <span className="text-xl font-bold text-blue-600">
          ${product.price}
        </span>
        
        <button
          onClick={handleAddToCart}
          disabled={product.stock <= 0 || isAddingToCart}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            product.stock <= 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : isInCart
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {product.stock <= 0
            ? "Out of Stock"
            : isInCart
            ? `In Cart (${quantity})`
            : isAddingToCart
            ? "Adding..."
            : "🛒 Add to Cart"}
        </button>
      </div>
      
      <p className={`text-xs mt-2 ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
      </p>
    </div>
  );
}
```

זה הקוד המלא והמוכן לשימוש! כל חלק מתועד והוסבר. מה תרצה שנתמקד בו הבא?