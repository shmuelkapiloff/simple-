import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";
import { asyncHandler } from "../utils/asyncHandler";

export class PaymentController {
  /**
   * Create payment intent
   * POST /api/payments/create-intent
   */
  static createIntent = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { orderId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    const result = await PaymentService.createPaymentIntent(userId, orderId);

    res.status(200).json({
      success: true,
      data: {
        payment: result.payment,
        status: result.status,
        clientSecret: result.clientSecret,
        checkoutUrl: result.checkoutUrl,
      },
    });
  });

  /**
   * Get payment status by order
   * GET /api/payments/:orderId/status
   */
  static getStatus = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const { orderId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const result = await PaymentService.getPaymentStatus(userId, orderId);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Webhook endpoint (public)
   * POST /api/payments/webhook
   */
  static webhook = asyncHandler(async (req: Request, res: Response) => {
    await PaymentService.handleWebhook(req);
    res.status(200).json({ success: true });
  });
}
