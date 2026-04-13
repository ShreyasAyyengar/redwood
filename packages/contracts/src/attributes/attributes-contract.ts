import { oc } from "@orpc/contract";
import { z } from "zod";
import { classroomSchema } from "../rooms/classroom-contract";
import { attributeSchema } from "./attributes-schemas";

export const attributesContract = {
  getAttributes: oc
    .route({
      method: "GET",
    })
    .output(z.array(attributeSchema))
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  addAttribute: oc
    .route({
      method: "POST",
    })
    .input(attributeSchema.pick({ label: true, color: true }))
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

  // todo find a nice way to update an existing attr

  deleteAttribute: oc
    .route({
      method: "DELETE",
    })
    .input(z.object({ id: attributeSchema.shape._id }))
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

  updateAttribute: oc
    .route({
      method: "PUT",
    })
    .input(
      attributeSchema
        .partial()
        .required({ _id: true })
        .refine((data) => data.color !== undefined || data.label !== undefined, {
          message: "At least color or label must be provided to edit attribute.",
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
            attributes: z.array(attributeSchema.shape._id),
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
