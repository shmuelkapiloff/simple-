import { FailedWebhookModel } from "../models/failed-webhook.model";
import { PaymentService } from "./payment.service";
import { log } from "../utils/logger";

/**
 * Webhook Retry Service
 * Processes failed webhooks with exponential backoff
 */
export class WebhookRetryService {
  private static isRunning = false;
  private static intervalId: NodeJS.Timeout | null = null;

  /**
   * Start the retry worker (call this in server.ts on startup)
   */
  static start(intervalMs: number = 60000) {
    // Every 1 minute
    if (this.isRunning) {
      log.warn("Webhook retry service already running");
      return;
    }

    this.isRunning = true;
    log.info("🔄 Starting webhook retry service", { intervalMs });

    this.intervalId = setInterval(() => {
      this.processRetries().catch((err) => {
        log.error("Webhook retry processing error", { error: err.message });
      });
    }, intervalMs);
  }

  /**
   * Stop the retry worker
   */
  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      log.info("⏹️ Stopped webhook retry service");
    }
  }

  /**
   * Process all webhooks ready for retry
   */
  static async processRetries() {
    const now = new Date();

    // Find webhooks ready for retry
    const failedWebhooks = await FailedWebhookModel.find({
      status: { $in: ["pending", "retrying"] },
      nextRetryAt: { $lte: now },
      retryCount: { $lt: 5 }, // Max 5 retries
    }).limit(10); // Process 10 at a time

    if (failedWebhooks.length === 0) {
      return;
    }

    log.info(`🔄 Processing ${failedWebhooks.length} failed webhooks`);

    for (const webhook of failedWebhooks) {
      await this.retryWebhook(webhook);
    }
  }

  /**
   * Retry a single webhook
   */
  private static async retryWebhook(webhook: any) {
    const startTime = Date.now();

    try {
      log.info("🔄 Retrying webhook", {
        eventId: webhook.eventId,
        attempt: webhook.retryCount + 1,
      });

      webhook.status = "retrying";
      webhook.retryCount += 1;
      webhook.lastAttemptAt = new Date();
      await webhook.save();

      // Simulate webhook request
      const mockReq = {
        body: webhook.payload,
        headers: webhook.payload.headers || {},
      } as any;

      await PaymentService.handleWebhook(mockReq);

      // Success!
      webhook.status = "succeeded";
      await webhook.save();

      const duration = Date.now() - startTime;
      log.info("✅ Webhook retry succeeded", {
        eventId: webhook.eventId,
        attempt: webhook.retryCount,
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      webhook.error = error.message;
      webhook.lastAttemptAt = new Date();

      // Calculate exponential backoff: 5min, 15min, 45min, 2h, 6h
      const backoffMinutes = Math.pow(3, webhook.retryCount) * 5;
      webhook.nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);

      if (webhook.retryCount >= webhook.maxRetries) {
        webhook.status = "failed";
        log.error("❌ Webhook retry failed - max retries reached", {
          eventId: webhook.eventId,
          maxRetries: webhook.maxRetries,
        });
      } else {
        webhook.status = "pending";
        log.warn("⚠️ Webhook retry failed - will retry", {
          eventId: webhook.eventId,
          attempt: webhook.retryCount,
          nextRetryAt: webhook.nextRetryAt,
          duration,
        });
      }

      await webhook.save();
    }
  }

  /**
   * Manually retry a specific webhook by ID
   */
  static async retryById(webhookId: string) {
    const webhook = await FailedWebhookModel.findById(webhookId);
    if (!webhook) {
      throw new Error("Webhook not found");
    }

    if (webhook.status === "succeeded") {
      throw new Error("Webhook already succeeded");
    }

    await this.retryWebhook(webhook);
  }
}
