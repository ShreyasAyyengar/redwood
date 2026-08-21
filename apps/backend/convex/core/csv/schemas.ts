import { z } from "zod";
import { scheduleSchema } from "../classrooms/schemas.ts";

export const csvRoomSchema = z.object({
  sourceRoomName: z.string().min(1),
  schedule: scheduleSchema,
});

export const csvRecordSchema = z.object({
  fileName: z.string().min(1),
  dateUploaded: z.iso.datetime(),
});
