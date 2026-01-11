import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * Public endpoint - Track order (NO AUTH REQUIRED)
 */
router.get("/track/:orderId", asyncHandler(OrderController.trackOrder));

/**
 * All routes below require authentication
 */
router.use(authenticate);

// POST /api/orders - Create new order from cart
router.post("/", asyncHandler(OrderController.createOrder));

// GET /api/orders - Get user's orders (with optional status filter)
router.get("/", asyncHandler(OrderController.getUserOrders));

// GET /api/orders/:orderId - Get order by ID
router.get("/:orderId", asyncHandler(OrderController.getOrderById));

// POST /api/orders/:orderId/cancel - Cancel order
router.post("/:orderId/cancel", asyncHandler(OrderController.cancelOrder));

export default router;
