import { taskSchema } from "@redwood/contracts";
import { toMongooseSchema } from "mongoose-zod";
import type { z } from "zod";
import { databaseConnection } from "./database";

const TaskSchemaMongooseZod = taskSchema;

const TaskSchemaMongoose = toMongooseSchema(
  TaskSchemaMongooseZod.mongoose({
    schemaOptions: {
      collection: "tasks",
      versionKey: false,
    },
  })
);

export interface ITaskSchemaMongoose extends z.infer<typeof TaskSchemaMongooseZod> {}

export const TaskService = databaseConnection.model<ITaskSchemaMongoose>("tasks", TaskSchemaMongoose, "tasks");
