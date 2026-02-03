import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { webhookRateLimiter } from "../middlewares/rate-limiter.middleware";
import { validateObjectId } from "../middlewares/validateObjectId.middleware";

const router = Router();

// Public webhook endpoint (no auth, with rate limiting)
router.post("/webhook", webhookRateLimiter, PaymentController.webhook);

// All routes below require authentication
router.use(requireAuth);

// POST /api/payments/create-intent - Create payment intent for an order
router.post("/create-intent", PaymentController.createIntent);
// Alias for better naming
router.post("/checkout", PaymentController.createIntent);

// GET /api/payments/:orderId/status - Get payment status for an order
router.get("/:orderId/status", PaymentController.getStatus);

export default router;
