import { z } from "zod";
import { redwoodUserSchema } from "../users/user-schemas";

export const csvRecordSchema = z.object({
  fileName: z.string(),
  dateUploaded: z.coerce.date(),
});

export const configurationSchema = z.object({
  users: z.array(redwoodUserSchema),
  csvRecords: csvRecordSchema.optional(),
});
