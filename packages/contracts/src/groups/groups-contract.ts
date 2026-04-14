import { oc } from "@orpc/contract";
import { z } from "zod";
import { classroomSchema } from "../rooms/classroom-contract";
import { groupSchema } from "./groups-schemas";

export const groupsContract = {
  getGroups: oc
    .route({
      method: "GET",
    })
    .output(z.array(groupSchema))
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  addGroup: oc
    .route({
      method: "POST",
    })
    .input(groupSchema.pick({ label: true }))
    .output(
      z.object({
        success: z.boolean(),
      })
    )
    .errors({
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

  deleteGroup: oc
    .route({
      method: "DELETE",
    })
    .input(z.object({ id: groupSchema.shape._id }))
    .output(
      z.object({
        success: z.boolean(),
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

  updateGroup: oc
    .route({
      method: "PUT",
    })
    .input(
      groupSchema
        .partial()
        .required({ _id: true })
        .refine((data) => data.label !== undefined, {
          message: "Label must be provided to edit group.",
        })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    )
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

  bulkUpdateClassrooms: oc
    .route({
      method: "POST",
    })
    .input(
      z.object({
        updates: z.array(
          z.object({
            classroomId: classroomSchema.shape._id,
            groupKey: z.string(),
          })
        ),
      })
    )
    .output(
      z.object({
        success: z.boolean(),
      })
    )
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),
};
