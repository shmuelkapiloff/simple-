"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const db_1 = require("./config/db");
const redisClient_1 = require("./config/redisClient");
const logger_1 = require("./utils/logger");
async function main() {
    console.log("🚀 שמואל: השרת מתחיל להתבסס!");
    console.log("=".repeat(50));
    console.log("🔥 שמואל: זה הלוג שלי - אני רואה שהקוד רץ!");
    console.log("=".repeat(50));
    try {
        console.log("📊 שמואל: מנסה להתחבר ל-MongoDB...");
        await (0, db_1.connectMongo)();
        console.log("✅ שמואל: MongoDB מחובר בהצלחה!");
    }
    catch (err) {
        console.log("❌ שמואל: MongoDB נכשל!");
        logger_1.logger.warn({ err }, "Continuing without Mongo connection for health readiness");
    }
    try {
        console.log("⚡ שמואל: מנסה להתחבר ל-Redis...");
        await (0, redisClient_1.connectRedis)();
        console.log("✅ שמואל: Redis מחובר בהצלחה!");
    }
    catch (err) {
        console.log("❌ שמואל: Redis נכשל!");
        logger_1.logger.warn({ err }, "Continuing without Redis connection for health readiness");
    }
    const app = (0, app_1.createApp)();
    console.log("🎯 שמואל: Express server נוצר בהצלחה!");
    app.listen(env_1.env.PORT, () => {
        logger_1.logger.info({ port: env_1.env.PORT }, "Server listening");
        console.log("✅ שמואל: השרת רץ על פורט", env_1.env.PORT);
    });
}
main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
});
