import { basicUserSchema } from "@redwood/contracts";
import { toMongooseSchema } from "mongoose-zod";
import { z } from "zod";
import { databaseConnection } from "./database";

const configurationSchema = z.object({
  users: z.array(basicUserSchema),
  roomGroups: z.array(z.string()),
  attributes: z.array(z.string()),
});

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
