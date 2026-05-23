import { taskTemplateSchema } from "@redwood/contracts";
import { toMongooseSchema } from "mongoose-zod";
import type { z } from "zod";
import { databaseConnection } from "./database";

const TaskTemplateSchemaMongooseZod = taskTemplateSchema;

const TaskTemplateSchemaMongoose = toMongooseSchema(
  TaskTemplateSchemaMongooseZod.mongoose({
    schemaOptions: {
      collection: "task-templates",
      versionKey: false,
    },
  })
);

TaskTemplateSchemaMongoose.index({ name: 1 });

export interface ITaskTemplateSchemaMongoose extends z.infer<typeof TaskTemplateSchemaMongooseZod> {}

export const TaskTemplateService = databaseConnection.model<ITaskTemplateSchemaMongoose>(
  "task-templates",
  TaskTemplateSchemaMongoose,
  "task-templates"
);
