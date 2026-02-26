import dotenv from "dotenv";
dotenv.config();

/**
 * Validate required environment variables for production
 */
function validateEnv() {
  const isProd = process.env.NODE_ENV === "production";
  const paymentProvider =
    process.env.PAYMENT_PROVIDER?.toLowerCase() || "stripe";

  // Require Stripe keys when using Stripe (default provider)
  if (paymentProvider === "stripe") {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error(
        "❌ STRIPE_SECRET_KEY is required when PAYMENT_PROVIDER is stripe"
      );
    }
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      if (isProd) {
        throw new Error(
          "❌ STRIPE_WEBHOOK_SECRET is required in production for webhook verification"
        );
      }
      console.warn(
        "⚠️  STRIPE_WEBHOOK_SECRET not set - webhook signature verification disabled"
      );
    }
  }

  // Require secure JWT secret in production
  if (isProd && !process.env.JWT_SECRET) {
    throw new Error("❌ JWT_SECRET is required in production");
  }

  // Require MongoDB URI in production
  if (isProd && !process.env.MONGO_URI) {
    throw new Error("❌ MONGO_URI is required in production");
  }
}

// Run validation on startup
validateEnv();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4001),
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/simple_shop",
  REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  JWT_SECRET:
    process.env.JWT_SECRET ||
    "your-super-secret-jwt-key-change-in-production-2024!",
  ALLOWED_ORIGINS:
    process.env.ALLOWED_ORIGINS ||
    "http://localhost:5173,http://localhost:3000,https://simple-4-anp6.onrender.com",
};
