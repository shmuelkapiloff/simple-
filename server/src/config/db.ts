import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

/** Mask credentials from MongoDB URI for safe logging */
function maskUri(uri: string): string {
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
  } catch {
    return "***masked***";
  }
}

export async function connectMongo() {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info({ uri: maskUri(env.MONGO_URI) }, "Mongo connected");
  } catch (err) {
    logger.error(
      { err, uri: maskUri(env.MONGO_URI) },
      "Mongo connection failed",
    );
    throw err;
  }
}
