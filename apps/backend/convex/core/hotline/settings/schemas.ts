import { z } from "zod";

export const hotlineMediaCodeFields = z.object({
  mediaCode: z.string().trim().min(1, "Enter the media code."),
  quarterLabel: z.string().trim().min(1, "Enter the quarter."),
});

export const hotlineSettingsSchema = hotlineMediaCodeFields.extend({
  key: z.literal("current"),
  updatedAt: z.number(),
  updatedBy: z.string(),
});
