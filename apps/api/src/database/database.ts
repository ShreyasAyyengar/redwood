import mongoose from "mongoose";
import { setup } from "mongoose-zod";
import { z } from "zod";
import { env } from "../env";
import { logger } from "../libs/logger";

setup({ z }); // mongoose-zod will add new functions to the prototype of `z`
await mongoose.connect(env.DATABASE_URL);

export const databaseConnection = mongoose.connection;

databaseConnection.once("open", () => {
  logger.info("[MongoDB] Connection opened!");
});

databaseConnection.on("error", (_error) => {
  logger.error("[MongoDB] Connection error: ", _error);
});
