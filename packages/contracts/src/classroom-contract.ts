import { oc } from "@orpc/contract";
import { z } from "zod";

const blockSchema = z
  .object({
    startTimeMin: z.number().int().min(0).max(1439),
    endTimeMin: z.number().int().min(1).max(1440),
  })
  .refine((b) => b.endTimeMin > b.startTimeMin, { message: "endTimeMin must be > startTimeMin" });

export const scheduleSchema = z.object({
  monday: z.array(blockSchema),
  tuesday: z.array(blockSchema),
  wednesday: z.array(blockSchema),
  thursday: z.array(blockSchema),
  friday: z.array(blockSchema),
  saturday: z.array(blockSchema),
  sunday: z.array(blockSchema),
});

export const classroomSchema = z.object({
  _id: z.uuidv7(),
  sourceRoomName: z.string(),
  displayName: z.string(), // by default will be sourceRoomName
  groupKey: z.string().default("Ungrouped"),
  schedule: scheduleSchema.optional(),
  lastMaintenance: z
    .object({
      date: z.coerce.date(),
      by: z.email(),
    })
    .optional(),
  roomStatus: z.enum(["GOOD", "NEEDS ATTENTION", "NEEDS URGENT ATTENTION"]).default("GOOD"),
  openTasksCount: z.number(), // denormalized -> derived by updates from writes // TODO not rlly accurate
  isActive: z.boolean().default(true),
  attributes: z
    .object({
      captioning: z
        .object({
          type: z.enum(["DTEN", "MAC"]),
          name: z.string(),
          ip: z.string(),
        })
        .optional(),
      touchPanel: z.boolean(),
      permanentSeating: z.boolean(),
      lecturnFan: z.boolean(),
    })
    .default({
      touchPanel: false,
      permanentSeating: false,
      lecturnFan: false,
    }),
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

  getRooms: oc
    .route({
      method: "GET",
    })
    .output(z.array(classroomSchema))
    .errors({
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
