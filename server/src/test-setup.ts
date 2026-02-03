import mongoose from "mongoose";
import { logger } from "./utils/logger";

// Test environment defaults (do not override user-provided values)
process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test-jwt-secret-change-me";
process.env.PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "stripe";
process.env.STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key";
process.env.STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_dummy_secret";

// Set test timeout globally
jest.setTimeout(30000);

/**
 * Jest Setup - Runs before all tests
 */
beforeAll(async () => {
  logger.info("🚀 Jest setup starting...");
  // Give MongoDB time to initialize
  await new Promise(resolve => setTimeout(resolve, 100));
});

/**
 * Jest Teardown - Runs after all tests
 */
afterAll(async () => {
  logger.info("🧹 Jest cleanup starting...");
  
  try {
    // Properly close MongoDB connection
    if (mongoose.connection.readyState !== 0) {
      if (process.env.TEST_MODE === "integration" && process.env.NODE_ENV === "test") {
        await mongoose.connection.dropDatabase();
        logger.info("✅ Test database dropped (integration mode)");
      }
      await mongoose.disconnect();
      logger.info("✅ MongoDB disconnected");
    }
  } catch (err) {
    logger.error({ err }, "❌ Error closing MongoDB connection");
  }

  // Clear all timers
  jest.clearAllTimers();
  logger.info("✅ All timers cleared");

  // Give async operations time to complete
  await new Promise(resolve => setTimeout(resolve, 100));
});

// Handle uncaught exceptions
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  logger.error({ reason }, "⚠️ Unhandled Rejection");
});

// Handle uncaught exceptions
process.on("uncaughtException", (error: any) => {
  logger.error({ error }, "⚠️ Uncaught Exception");
});

// Mock Redis for tests
jest.mock("./config/redisClient", () => ({
  redis: {
    status: "ready",
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    setex: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
    flushdb: jest.fn().mockResolvedValue("OK"),
    on: jest.fn(),
  },
  connectRedis: jest.fn().mockResolvedValue(undefined),
}));
