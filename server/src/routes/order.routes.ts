import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * Order operations
 */

// ⬅️ Public endpoint - GET /api/orders/track/:orderId - Track order (NO AUTH REQUIRED)
// Note: Placed BEFORE authenticate middleware
router.get("/track/:orderId", OrderController.trackOrder);

/**
 * All routes below require authentication
 */
router.use(authenticate);

// POST /api/orders - Create new order from cart
router.post("/", OrderController.createOrder);

// GET /api/orders - Get user's orders (with optional status filter)
router.get("/", OrderController.getUserOrders);

// GET /api/orders/:orderId - Get order by ID
router.get("/:orderId", OrderController.getOrderById);

// POST /api/orders/:orderId/cancel - Cancel order
router.post("/:orderId/cancel", OrderController.cancelOrder);

export default router;
