import { maintenanceEntrySchema } from "@redwood/contracts";
import { toMongooseSchema } from "mongoose-zod";
import type { z } from "zod";
import { databaseConnection } from "./database";

const MaintenanceEntrySchemaMongooseZod = maintenanceEntrySchema;

const MaintenanceEntrySchemaMongoose = toMongooseSchema(
  MaintenanceEntrySchemaMongooseZod.mongoose({
    schemaOptions: {
      collection: "maintenance",
      versionKey: false,
    },
  })
);

MaintenanceEntrySchemaMongoose.index({ classroomId: 1, date: -1, _id: -1 });

export interface IMaintenanceEntrySchemaMongoose extends z.infer<typeof MaintenanceEntrySchemaMongooseZod> {}

export const MaintenanceService = databaseConnection.model<IMaintenanceEntrySchemaMongoose>(
  "maintenance",
  MaintenanceEntrySchemaMongoose,
  "maintenance"
);
