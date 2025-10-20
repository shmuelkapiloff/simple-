import Redis from "ioredis";
import { env } from "./env";
import { logger } from "../utils/logger";

// Use lazyConnect so tests importing code do not open a socket automatically.
export const redis = new Redis(env.REDIS_URL, { lazyConnect: true });

export async function connectRedis() {
  if (redis.status === "end" || redis.status === "wait") {
    await redis.connect();
  }
}

redis.on("connect", () => logger.info("Redis connected"));
redis.on("error", (err) => logger.error({ err }, "Redis error"));
