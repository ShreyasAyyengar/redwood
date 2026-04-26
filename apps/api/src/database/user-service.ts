import { userSchema } from "@redwood/contracts";
import { toMongooseSchema } from "mongoose-zod";
import type { z } from "zod";
import { databaseConnection } from "./database";

const UserSchemaMongooseZod = userSchema;

const UserSchemaMongoose = toMongooseSchema(
  UserSchemaMongooseZod.mongoose({
    schemaOptions: {
      collection: "user",
      versionKey: false,
    },
  })
);

UserSchemaMongoose.index({ email: 1 });

export interface IUserSchemaMongoose extends z.infer<typeof UserSchemaMongooseZod> {}

export const UserService = databaseConnection.model<IUserSchemaMongoose>("user", UserSchemaMongoose, "user");
