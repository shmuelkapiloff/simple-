import { Request, Response } from "express";
import { PaymentService } from "../services/payment.service";

export class PaymentController {
  /**
   * Create payment intent
   * POST /api/payments/create-intent
   */
  static async createIntent(req: Request, res: Response) {
    try {
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
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create payment intent",
      });
    }
  }

  /**
   * Get payment status by order
   * GET /api/payments/:orderId/status
   */
  static async getStatus(req: Request, res: Response) {
    try {
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
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to fetch payment status",
      });
    }
  }

  /**
   * Webhook endpoint (public)
   * POST /api/payments/webhook
   */
  static async webhook(req: Request, res: Response) {
    try {
      await PaymentService.handleWebhook(req);
      res.status(200).json({ success: true });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Webhook handling failed",
      });
    }
  }
}
