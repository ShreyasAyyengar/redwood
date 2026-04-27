import { oc } from "@orpc/contract";
import { z } from "zod";
import { feedbackSchemaPayload } from "./feedback-schemas";

export const feedbackContract = {
  sendFeedback: oc
    .route({
      method: "POST",
    })
    .input(feedbackSchemaPayload)
    .output(z.object({ success: z.boolean() }))
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),
};
