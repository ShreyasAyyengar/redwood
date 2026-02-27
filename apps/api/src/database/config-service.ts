import { toMongooseSchema } from "mongoose-zod";
import { z } from "zod";
import { databaseConnection } from "./database";

const basicUserSchema = z.object({
  email: z.email(),
  role: z.enum(["employee", "supervisor", "admin"]),
});

const configurationSchema = z.object({
  users: z.array(basicUserSchema),
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

export const ConfigurationCollection = databaseConnection.model<IConfigurationSchemaMongoose>(
  "configuration",
  ConfigurationSchemaMongoose,
  "configuration"
);
