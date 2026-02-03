import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

/**
 * Cart Routes
 * Base URL: /api/cart
 * Note: All cart routes require authentication - no guest mode
 */

// GET /api/cart - קבלת עגלה נוכחית
router.get("/", requireAuth, CartController.getCart);

// GET /api/cart/count - ספירת פריטים בעגלה
router.get("/count", requireAuth, CartController.getCartCount);

// POST /api/cart/add - הוספת פריט לעגלה
router.post("/add", requireAuth, CartController.addToCart);

// PUT /api/cart/update - עדכון כמות פריט
router.put("/update", requireAuth, CartController.updateQuantity);

// DELETE /api/cart/remove - הסרת פריט מעגלה
router.delete("/remove", requireAuth, CartController.removeFromCart);

// DELETE /api/cart/clear - ניקוי עגלה מלאה
router.delete("/clear", requireAuth, CartController.clearCart);

export default router;
