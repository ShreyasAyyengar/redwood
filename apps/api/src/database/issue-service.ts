import { issueSchema } from "@redwood/contracts";
import { toMongooseSchema } from "mongoose-zod";
import type { z } from "zod";
import { databaseConnection } from "./database";

const IssueSchemaMongooseZod = issueSchema;

const IssueSchemaMongoose = toMongooseSchema(
  IssueSchemaMongooseZod.mongoose({
    schemaOptions: {
      collection: "issues",
      versionKey: false,
    },
  })
);

export interface IIssueSchemaMongoose extends z.infer<typeof IssueSchemaMongooseZod> {}

export const IssueService = databaseConnection.model<IIssueSchemaMongoose>("issues", IssueSchemaMongoose, "issues");
