import { oc } from "@orpc/contract";
import { z } from "zod";

export const attributesContract = {
  getAttributes: oc
    .route({
      method: "GET",
    })
    .output(z.array(z.string()))
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
    .input(z.object({ attribute: z.string() }))
    .output(z.boolean())
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

  updateAttributes: oc
    .route({
      method: "PATCH",
    })
    .input(z.object({ attributes: z.array(z.string()) }))
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

  deleteAttribute: oc
    .route({
      method: "DELETE",
    })
    .input(z.object({ attribute: z.string() }))
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
};
