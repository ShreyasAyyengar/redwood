import { oc } from "@orpc/contract";
import { z } from "zod";
import { maintenanceEntrySchema } from "./maintenance-schema";

export const classroomSchema = z.object({
  _id: z.uuidv7(),
  sourceRoomName: z.string(),
  groupKey: z.string().default("Miscellaneous"),
  displayName: z.string(), // by default will be sourceRoomName
  number: z.string(),
  isActive: z.boolean().default(true),
  schedule: z
    .object({
      monday: z.array(
        z.object({
          startTime: z.string(),
          endTime: z.string(),
        })
      ),
      tuesday: z.array(
        z.object({
          startTime: z.string(),
          endTime: z.string(),
        })
      ),
      wednesday: z.array(
        z.object({
          startTime: z.string(),
          endTime: z.string(),
        })
      ),
      thursday: z.array(
        z.object({
          startTime: z.string(),
          endTime: z.string(),
        })
      ),
      friday: z.array(
        z.object({
          startTime: z.string(),
          endTime: z.string(),
        })
      ),
    })
    .optional(),
  openTasksCount: z.number(), // denormalized -> derived by updates by writes
  lastMaintenance: z
    .object({
      date: z.date(),
      by: z.email(),
    })
    .optional(),
  captioning: z
    .object({
      type: z.enum(["DTEN", "MAC"]),
      name: z.string(),
      ip: z.string(),
    })
    .optional(),
});

export const classroomContract = {
  loadRooms: oc
    .route({
      method: "POST",
    })
    .input(z.object({ csvFile: z.file() }))
    .output(z.boolean())
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  getRoom: oc
    .route({
      method: "GET",
    })
    .input(classroomSchema.shape._id)
    .output(classroomSchema)
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

  addMaintenanceEntry: oc
    .route({
      method: "POST",
    })
    .input(
      z.object({
        classroomId: classroomSchema.shape._id,
        maintenanceEntry: maintenanceEntrySchema,
      })
    )
    .output(z.boolean())
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

  editMaintenanceEntry: oc
    .route({
      method: "PUT",
    })
    .input(
      z.object({
        maintenanceEntryId: maintenanceEntrySchema.shape.id,
        maintenanceEntry: maintenanceEntrySchema,
      })
    )
    .output(z.boolean())
    .errors({
      FORBIDDEN: {
        // TODO in router, if not original email and not admin
        data: z.object({
          message: z.string(),
        }),
      },
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

// mapping of raw names to groups, e.g "Cowell Com {num}" and "Cowell Clrm {num}" -> "Cowell"
// mapping of raw names to classroom display names:
// - "Cowell Clrm 131" -> "Cowell 131"
// - "Cowell Com 134" -> "Cowell 134"
