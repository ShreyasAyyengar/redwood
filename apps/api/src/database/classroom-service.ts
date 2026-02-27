import { classroomSchema } from "@redwood/contracts";
import { toMongooseSchema } from "mongoose-zod";
import type { z } from "zod";
import { databaseConnection } from "./database";

const ClassroomSchemaMongooseZod = classroomSchema;

const ClassroomSchemaMongoose = toMongooseSchema(
  ClassroomSchemaMongooseZod.mongoose({
    schemaOptions: {
      collection: "classrooms",
      versionKey: false,
    },
  })
);

export interface IClassroomSchemaMongoose extends z.infer<typeof ClassroomSchemaMongooseZod> {}

export const ClassroomService = databaseConnection.model<IClassroomSchemaMongoose>("classrooms", ClassroomSchemaMongoose, "classrooms");
