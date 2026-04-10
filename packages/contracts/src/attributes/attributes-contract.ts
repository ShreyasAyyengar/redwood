import { oc } from "@orpc/contract";
import { z } from "zod";
import { attributeSchema } from "../configuration/config-schemas";

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
    .input(z.object({ attribute: attributeSchema }))
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

  // todo find a nice way to update an existing attr

  deleteAttribute: oc
    .route({
      method: "DELETE",
    })
    .input(z.object({ attribute: attributeSchema }))
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
