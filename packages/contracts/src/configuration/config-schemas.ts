import { z } from "zod";
import { redwoodUserSchema } from "../users/user-schemas";

export const attributeSchema = z.object({
  label: z.string(),
  color: z.string(),
});

export const csvRecordSchema = z.object({
  fileName: z.string(),
  dateUploaded: z.coerce.date(),
});

export const configurationSchema = z.object({
  users: z.array(redwoodUserSchema),
  roomGroups: z
    .array(
      z.object({
        startingWith: z.string(),
        under: z.string(),
      })
    )
    .default([]),
  attributes: z.array(attributeSchema),
  csvRecords: csvRecordSchema.optional(),
});
