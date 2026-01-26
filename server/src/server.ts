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
