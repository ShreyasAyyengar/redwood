import { z } from "zod";

export const attributeSchema = z.object({
  label: z.string(),
  color: z.string(),
});

export const attributeFormSchema = z.object({
  label: z.string().trim().min(1, "Label is required"),
  color: z.string(),
});
