import { z } from "zod";
import { attributeSchema } from "../attributes/attributes-schemas";

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
  _id: z.uuidv7(),
  sourceRoomName: z.string(),
  displayName: z.string(), // by default will be sourceRoomName
  groupKey: z.string().default("Ungrouped"),
  schedule: scheduleSchema.optional(),
  lastMaintenance: z
    .object({
      date: z.coerce.date(),
      by: z.email(),
    })
    .optional(),
  roomStatus: z.enum(["GOOD", "NEEDS ATTENTION", "NEEDS URGENT ATTENTION"]).default("GOOD"),
  isActive: z.boolean().default(true),
  captioning: z
    .object({
      type: z.enum(["DTEN", "MAC"]),
      name: z.string(),
      ip: z.string(),
    })
    .optional(),
  attributes: z.array(attributeSchema.shape._id).default([]),
});

export const classroomSchemaPayload = classroomSchema.extend({
  openTasksCount: z.number(),
});
