import dotenv from "dotenv";
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/simple_shop",
  REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
};
