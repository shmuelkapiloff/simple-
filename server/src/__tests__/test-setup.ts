import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { logger } from "../utils/logger";

// ── Environment defaults ────────────────────────────────────────────────
process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret-change-me";
process.env.PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || "stripe";
process.env.STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key";
process.env.STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET || "whsec_test_dummy_secret";

jest.setTimeout(30000);

let mongoServer: MongoMemoryServer;

// ── Setup: start in-memory MongoDB ──────────────────────────────────────
beforeAll(async () => {
  logger.info("🚀 Jest setup — starting in-memory MongoDB…");
  mongoServer = await MongoMemoryServer.create({ binary: { version: '4.4.10' } });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  logger.info("✅ In-memory MongoDB connected");
});

// ── Teardown: stop in-memory MongoDB ────────────────────────────────────
afterAll(async () => {
  logger.info("🧹 Jest cleanup…");
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
      logger.info("✅ MongoDB disconnected");
    }
  } catch (err) {
    logger.error({ err }, "❌ Error closing MongoDB");
  }

  if (mongoServer) {
    await mongoServer.stop();
    logger.info("✅ In-memory MongoDB stopped");
  }

  jest.clearAllTimers();
  await new Promise((resolve) => setTimeout(resolve, 100));
});

// ── Global error handlers ───────────────────────────────────────────────
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "⚠️ Unhandled Rejection");
});
process.on("uncaughtException", (error) => {
  logger.error({ error }, "⚠️ Uncaught Exception");
});

// ── Mock Redis (tests don't need real Redis) ────────────────────────────
jest.mock("../config/redisClient", () => ({
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
