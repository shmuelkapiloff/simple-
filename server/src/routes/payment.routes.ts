import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Public webhook endpoint (no auth)
router.post("/webhook", PaymentController.webhook);

// All routes below require authentication
router.use(authenticate);

// POST /api/payments/create-intent - Create payment intent for an order
router.post("/create-intent", PaymentController.createIntent);

// GET /api/payments/:orderId/status - Get payment status for an order
router.get("/:orderId/status", PaymentController.getStatus);

export default router;
