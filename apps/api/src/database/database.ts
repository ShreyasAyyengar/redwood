import mongoose from "mongoose";
import { setup } from "mongoose-zod";
import { z } from "zod";
import { env } from "../env";
import { logger } from "../libs/logger";

setup({ z }); // mongoose-zod will add new functions to the prototype of `z`

export const databaseConnection = mongoose.connection;

databaseConnection.on("connected", () => {
  logger.info("[MongoDB] Connection connected!");
});

databaseConnection.on("error", (_error) => {
  logger.error("[MongoDB] Connection error: ", _error);
});

await mongoose.connect(env.DATABASE_URL, {
  retryReads: true,
  retryWrites: true,
  maxPoolSize: 5,
  minPoolSize: 1,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 30_000,
  connectTimeoutMS: 10_000,
  maxIdleTimeMS: 60_000,
});

logger.info("[MongoDB] Initial connection established!");
