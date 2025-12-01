import { createApp } from "./app";
import { env } from "./config/env";
import { connectMongo } from "./config/db";
import { connectRedis } from "./config/redisClient";
import { logger } from "./utils/logger";

async function main() {
  try {
    await connectMongo();
    logger.info("MongoDB connected successfully");
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

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Server listening");
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
