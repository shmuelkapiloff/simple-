import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { validateOrderId } from "../middlewares/validateObjectId.middleware";

const router = Router();

/**
 * Public endpoint - Track order (NO AUTH REQUIRED)
 */
router.get(
  "/track/:orderId",
  validateOrderId,
  asyncHandler(OrderController.trackOrder)
);

/**
 * All routes below require authentication
 */
router.use(requireAuth);

// POST /api/orders - Create new order from cart
router.post("/", asyncHandler(OrderController.createOrder));

// GET /api/orders - Get user's orders (with optional status filter)
router.get("/", asyncHandler(OrderController.getUserOrders));

// GET /api/orders/:orderId - Get order by ID
router.get(
  "/:orderId",
  validateOrderId,
  asyncHandler(OrderController.getOrderById)
);

// POST /api/orders/:orderId/cancel - Cancel order
router.post(
  "/:orderId/cancel",
  validateOrderId,
  asyncHandler(OrderController.cancelOrder)
);

export default router;
