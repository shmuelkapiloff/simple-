import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import { optionalAuth } from "../middlewares/auth.middleware";

const router = Router();

/**
 * Cart Routes
 * Base URL: /api/cart
 * Note: All cart routes use optionalAuth to support both guests and logged-in users
 */

// GET /api/cart - קבלת עגלה נוכחית
router.get("/", optionalAuth, CartController.getCart);

// GET /api/cart/count - ספירת פריטים בעגלה
router.get("/count", optionalAuth, CartController.getCartCount);

// POST /api/cart/add - הוספת פריט לעגלה
router.post("/add", optionalAuth, CartController.addToCart);

// PUT /api/cart/update - עדכון כמות פריט
router.put("/update", optionalAuth, CartController.updateQuantity);

// DELETE /api/cart/remove - הסרת פריט מעגלה
router.delete("/remove", optionalAuth, CartController.removeFromCart);

// DELETE /api/cart/clear - ניקוי עגלה מלאה
router.delete("/clear", optionalAuth, CartController.clearCart);

// POST /api/cart/merge - מיזוג עגלת אורח לעגלת משתמש (לאחר התחברות)
router.post("/merge", optionalAuth, CartController.mergeGuestCart);

export default router;
