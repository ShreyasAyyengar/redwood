import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";

const blockSchema = z
  .object({
    startTimeMin: z.number().int().min(0).max(1439),
    endTimeMin: z.number().int().min(1).max(1440),
  })
  .refine((b) => b.endTimeMin > b.startTimeMin, { message: "endTimeMin must be > startTimeMin" });

export const scheduleSchema = z.object({
  monday: z.array(blockSchema),
  tuesday: z.array(blockSchema),
  wednesday: z.array(blockSchema),
  thursday: z.array(blockSchema),
  friday: z.array(blockSchema),
  saturday: z.array(blockSchema),
  sunday: z.array(blockSchema),
});

export const classroomSchema = z.object({
  sourceRoomName: z.string(),
  displayName: z.string(), // by default will be sourceRoomName
  groupKey: z.string().default("Ungrouped"),
  schedule: scheduleSchema.optional(),
  lastMaintenance: z
    .object({
      date: z.iso.datetime(),
      by: z.email(),
    })
    .optional(),
  isActive: z.boolean().default(true),
  captioning: z
    .object({
      isCaptioningThisQuarter: z.boolean(),
      type: z.enum(["DTEN", "MAC"]),
      identifier: z.string(),
    })
    .optional(),
  attributes: z.array(zid("attributes")),
});

export const classroomSchemaPayload = classroomSchema.extend({
  openTasksCount: z.number(),
  activeIssuesCount: z.number(),
});
