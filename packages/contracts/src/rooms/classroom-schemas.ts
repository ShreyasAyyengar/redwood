import { oc } from "@orpc/contract";
import { z } from "zod";
import { csvRecordSchema } from "../configuration/config-schemas";
import { classroomSchema } from "./classroom-contract";

export const classroomContract = {
  loadClassrooms: oc
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

  getCSVRecord: oc
    .route({
      method: "GET",
    })
    .output(csvRecordSchema.nullable())
    .errors({
      NOT_FOUND: {
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
