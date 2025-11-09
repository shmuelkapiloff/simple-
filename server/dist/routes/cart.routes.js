"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cart_controller_1 = require("../controllers/cart.controller");
const router = (0, express_1.Router)();
/**
 * Cart Routes
 * Base URL: /api/cart
 */
// GET /api/cart - קבלת עגלה נוכחית
router.get('/', cart_controller_1.CartController.getCart);
// GET /api/cart/count - ספירת פריטים בעגלה
router.get('/count', cart_controller_1.CartController.getCartCount);
// POST /api/cart/add - הוספת פריט לעגלה
router.post('/add', cart_controller_1.CartController.addToCart);
// PUT /api/cart/update - עדכון כמות פריט
router.put('/update', cart_controller_1.CartController.updateQuantity);
// DELETE /api/cart/remove - הסרת פריט מעגלה
router.delete('/remove', cart_controller_1.CartController.removeFromCart);
// DELETE /api/cart/clear - ניקוי עגלה מלאה
router.delete('/clear', cart_controller_1.CartController.clearCart);
exports.default = router;
