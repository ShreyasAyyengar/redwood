import { oc } from "@orpc/contract";
import { z } from "zod";
import { classroomSchema } from "../rooms/classroom-contract";
import { maintenanceEntrySchema } from "./maintenance-schemas";

export const maintenanceContract = {
  addMaintenanceEntry: oc
    .route({
      method: "POST",
    })
    .input(maintenanceEntrySchema.omit({ _id: true, completedBy: true }))
    .output(z.boolean())
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      UNPROCESSABLE_CONTENT: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  getHistory: oc
    .route({
      method: "GET",
    })
    .input(
      z.object({
        classroomId: classroomSchema.shape._id,
        cursor: maintenanceEntrySchema.shape._id.optional(),
      })
    )
    .output(
      z.object({
        history: z.array(maintenanceEntrySchema),
        nextCursor: maintenanceEntrySchema.shape._id.optional(),
      })
    )
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),
};
