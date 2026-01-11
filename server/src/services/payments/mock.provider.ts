import { PaymentStatus } from "../../models/payment.model";
import {
  CreateIntentParams,
  CreateIntentResult,
  PaymentProvider,
  StatusResult,
} from "./payment.provider";
import { Request } from "express";
import crypto from "crypto";

const generateId = (prefix: string) =>
  `${prefix}_${crypto.randomBytes(8).toString("hex")}`;

export class MockProvider implements PaymentProvider {
  name = "mock";

  async createPaymentIntent(
    params: CreateIntentParams
  ): Promise<CreateIntentResult> {
    const providerPaymentId = generateId("pay");
    const status: PaymentStatus = "succeeded"; // For demo, mark as success immediately

    return {
      providerPaymentId,
      status,
      clientSecret: generateId("cs"),
      checkoutUrl: `https://mock.checkout/${providerPaymentId}`,
      raw: {
        note: "Mock payment provider used for demo",
        orderId: params.orderId,
        amount: params.amount,
        currency: params.currency,
      },
    };
  }

  async getPaymentStatus(providerPaymentId: string): Promise<StatusResult> {
    return {
      providerPaymentId,
      status: "succeeded",
      raw: { note: "Mock provider always returns succeeded" },
    };
  }

  async handleWebhook(_req: Request): Promise<StatusResult> {
    // In mock, we just return a succeeded status; no signature validation.
    const providerPaymentId = generateId("pay");
    return {
      providerPaymentId,
      status: "succeeded",
      raw: { note: "Mock webhook callback" },
    };
  }

  async refund(providerPaymentId: string): Promise<StatusResult> {
    return {
      providerPaymentId,
      status: "refunded",
      raw: { note: "Mock refund" },
    };
  }
}
