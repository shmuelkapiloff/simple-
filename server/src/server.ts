import app from "./app";
import { env } from "./config/env";
import { connectMongo } from "./config/db";
import { connectRedis } from "./config/redisClient";
import { WebhookRetryService } from "./services/webhook-retry.service";
import { logger } from "./utils/logger";

async function main() {
  try {
    await connectMongo();
    logger.info("MongoDB connected successfully");
    
    // 🔄 Start webhook retry service
    WebhookRetryService.start(60000); // Check every 1 minute
    logger.info("Webhook retry service started");
  } catch (err) {
    logger.warn(
      { err },
      "Continuing without Mongo connection for health readiness"
    );
  }

  try {
    await connectRedis();
    logger.info("Redis connected successfully");
  } catch (err) {
    logger.warn(
      { err },
      "Continuing without Redis connection for health readiness"
    );
  }

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Server listening");
    
    // 🔔 Log webhook configuration status
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const clientUrl = process.env.CLIENT_URL;
    
    if (!webhookSecret) {
      logger.warn("⚠️ STRIPE_WEBHOOK_SECRET not configured - webhook signature verification disabled!");
      logger.warn("   Set STRIPE_WEBHOOK_SECRET in your environment variables");
    } else {
      logger.info("✅ Stripe webhook secret configured");
    }
    
    if (!clientUrl) {
      logger.warn("⚠️ CLIENT_URL not configured - using fallback: http://localhost:3000");
      logger.warn("   Set CLIENT_URL in your environment variables for production");
    } else {
      logger.info({ clientUrl }, "✅ Client URL configured");
    }
    
    logger.info("🎯 Webhook endpoint ready at: /api/payments/webhook");
  });

  // Handle listen errors (e.g., EADDRINUSE)
  server.on("error", (err: any) => {
    const code = err?.code;
    if (code === "EADDRINUSE") {
      logger.error({ port: env.PORT, err }, "Port is already in use");
      logger.error("Try changing PORT in your .env or free the port (4001)");
    } else {
      logger.error({ err }, "HTTP server error");
    }
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info({ signal }, "Shutting down");
    
    // Stop webhook retry service
    WebhookRetryService.stop();
    
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown.bind(null, "SIGINT"));
  process.on("SIGTERM", shutdown.bind(null, "SIGTERM"));
}

main().catch((err) => {
  // Log critical startup error
  if (typeof console !== "undefined") {
    console.error("[CRITICAL]", err instanceof Error ? err.message : err);
  }
  process.exit(1);
});
