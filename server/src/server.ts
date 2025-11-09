import { createApp } from "./app";
import { env } from "./config/env";
import { connectMongo } from "./config/db";
import { connectRedis } from "./config/redisClient";
import { logger } from "./utils/logger";

async function main() {
  console.log("🚀 שמואל: השרת מתחיל להתבסס!");
  console.log("=".repeat(50));
  console.log("🔥 שמואל: זה הלוג שלי - אני רואה שהקוד רץ!");
  console.log("=".repeat(50));

  try {
    console.log("📊 שמואל: מנסה להתחבר ל-MongoDB...");
    await connectMongo();
    console.log("✅ שמואל: MongoDB מחובר בהצלחה!");
  } catch (err) {
    console.log("❌ שמואל: MongoDB נכשל!");
    logger.warn(
      { err },
      "Continuing without Mongo connection for health readiness"
    );
  }

  try {
    console.log("⚡ שמואל: מנסה להתחבר ל-Redis...");
    await connectRedis();
    console.log("✅ שמואל: Redis מחובר בהצלחה!");
  } catch (err) {
    console.log("❌ שמואל: Redis נכשל!");
    logger.warn(
      { err },
      "Continuing without Redis connection for health readiness"
    );
  }

  const app = createApp();
  console.log("🎯 שמואל: Express server נוצר בהצלחה!");
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Server listening");
    console.log("✅ שמואל: השרת רץ על פורט", env.PORT);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
