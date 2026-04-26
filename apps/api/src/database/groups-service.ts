import { groupSchema } from "@redwood/contracts";
import { toMongooseSchema } from "mongoose-zod";
import type { z } from "zod";
import { databaseConnection } from "./database";

const GroupSchemaMongooseZod = groupSchema;

const GroupSchemaMongoose = toMongooseSchema(
  GroupSchemaMongooseZod.mongoose({
    schemaOptions: {
      collection: "groups",
      versionKey: false,
    },
  })
);

GroupSchemaMongoose.index({ label: 1 });

export interface IGroupSchemaMongoose extends z.infer<typeof GroupSchemaMongooseZod> {}

export const GroupService = databaseConnection.model<IGroupSchemaMongoose>("groups", GroupSchemaMongoose, "groups");
