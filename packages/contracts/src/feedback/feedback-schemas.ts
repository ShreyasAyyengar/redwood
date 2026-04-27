import { z } from "zod";

export const feedbackSchemaPayload = z.object({
  description: z.string(),
  attachments: z.array(z.file()),
});
