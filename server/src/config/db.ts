import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

export async function connectMongo() {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info({ uri: env.MONGO_URI }, "Mongo connected");
  } catch (err) {
    logger.error({ err }, "Mongo connection failed");
    throw err;
  }
}
