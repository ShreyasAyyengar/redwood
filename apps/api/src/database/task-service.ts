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

TaskSchemaMongoose.index({ classroomId: 1, "task.createdAt": -1, _id: -1 });
TaskSchemaMongoose.index({ classroomId: 1, "completion.completedAt": -1, _id: -1 });
TaskSchemaMongoose.index({ completion: 1, visibleAt: 1, classroomId: 1 });
TaskSchemaMongoose.index({ "task.createdAt": -1, _id: -1 });
TaskSchemaMongoose.index({ "completion.completedAt": -1, _id: -1 });

export interface ITaskSchemaMongoose extends z.infer<typeof TaskSchemaMongooseZod> {}

export const TaskService = databaseConnection.model<ITaskSchemaMongoose>("tasks", TaskSchemaMongoose, "tasks");
