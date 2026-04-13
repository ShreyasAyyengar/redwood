import { attributeSchema } from "@redwood/contracts";
import { toMongooseSchema } from "mongoose-zod";
import type { z } from "zod";
import { databaseConnection } from "./database";

const AttributeSchemaMongooseZod = attributeSchema;

const AttributeSchemaMongoose = toMongooseSchema(
  AttributeSchemaMongooseZod.mongoose({
    schemaOptions: {
      collection: "attributes",
      versionKey: false,
    },
  })
);

export interface IAttributeSchemaMongoose extends z.infer<typeof AttributeSchemaMongooseZod> {}

export const AttributeService = databaseConnection.model<IAttributeSchemaMongoose>("attributes", AttributeSchemaMongoose, "attributes");
