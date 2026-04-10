import { configurationSchema } from "@redwood/contracts";
import { toMongooseSchema } from "mongoose-zod";
import type { z } from "zod";
import { databaseConnection } from "./database";

const ConfigurationSchemaMongoose = toMongooseSchema(
  configurationSchema.mongoose({
    schemaOptions: {
      collection: "configuration",
      versionKey: false,
    },
  })
);

export interface IConfigurationSchemaMongoose extends z.infer<typeof configurationSchema> {}

export const ConfigService = databaseConnection.model<IConfigurationSchemaMongoose>(
  "configuration",
  ConfigurationSchemaMongoose,
  "configuration"
);
