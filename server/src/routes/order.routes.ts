import { Router } from "express";
import { OrderController } from "../controllers/order.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Apply authentication middleware to all order routes
router.use(AuthMiddleware.requireAuth);

/**
 * @route POST /api/orders
 * @desc Create a new order from cart
 * @access Private (Authenticated users)
 */
router.post("/", OrderController.createOrder);

/**
 * @route GET /api/orders
 * @desc Get user's orders with optional filtering
 * @access Private (Authenticated users)
 * @query status - Filter by order status (optional)
 * @query limit - Number of orders to return (default: 10)
 * @query offset - Number of orders to skip (default: 0)
 */
router.get("/", OrderController.getUserOrders);

/**
 * @route GET /api/orders/stats
 * @desc Get order statistics (Admin only)
 * @access Private (Admin only)
 */
router.get(
  "/stats",
  AuthMiddleware.requireAdmin,
  OrderController.getOrderStats
);

/**
 * @route GET /api/orders/:orderId
 * @desc Get specific order details
 * @access Private (Authenticated users - own orders only)
 */
router.get("/:orderId", OrderController.getOrderById);

/**
 * @route POST /api/orders/:orderId/cancel
 * @desc Cancel an order
 * @access Private (Authenticated users - own orders only)
 */
router.post("/:orderId/cancel", OrderController.cancelOrder);

/**
 * @route PUT /api/orders/:orderId/status
 * @desc Update order status (Admin only)
 * @access Private (Admin only)
 */
router.put(
  "/:orderId/status",
  AuthMiddleware.requireAdmin,
  OrderController.updateOrderStatus
);

export default router;
