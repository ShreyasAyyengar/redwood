import { oc } from "@orpc/contract";
import { z } from "zod";
import { csvRecordSchema } from "../configuration/config-schemas";
import { classroomSchema, classroomSchemaPayload } from "./classroom-contract";

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
    .input(
      z.object({
        id: classroomSchema.shape._id,
      })
    )
    .output(classroomSchemaPayload)
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
    .output(z.array(classroomSchemaPayload))
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  updateRoom: oc
    .route({
      method: "PATCH",
    })
    .input(classroomSchema.pick({ _id: true, groupKey: true, attributes: true, captioning: true }).partial().required({ _id: true }))
    .output(classroomSchemaPayload)
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
