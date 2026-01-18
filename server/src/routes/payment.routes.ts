import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validateOrderId } from "../middlewares/validateObjectId.middleware";

const router = Router();

// Public webhook endpoint (no auth)
router.post("/webhook", PaymentController.webhook);

// All routes below require authentication
router.use(requireAuth);

// POST /api/payments/create-intent - Create payment intent for an order
router.post("/create-intent", PaymentController.createIntent);
// Alias for better naming
router.post("/checkout", PaymentController.createIntent);

// GET /api/payments/:orderId/status - Get payment status for an order
router.get("/:orderId/status", validateOrderId, PaymentController.getStatus);

export default router;
