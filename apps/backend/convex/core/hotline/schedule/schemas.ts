import { z } from "zod";

const timeRangeSchema = z.object({
  start: z.iso.time(),
  end: z.iso.time(),
});

const availabilityProfileSchema = z.object({
  shift: timeRangeSchema,
  blockages: z.array(timeRangeSchema),
});

const daySchema = z.object({
  breaks: z.array(timeRangeSchema),
  available: z.array(timeRangeSchema),
  lastAvailable: z.array(timeRangeSchema),
  solo: z.array(timeRangeSchema),
});

const generatedWeeklySchedule = z.object({
  schedule: z.object({
    monday: daySchema.nullable(),
    tuesday: daySchema.nullable(),
    wednesday: daySchema.nullable(),
    thursday: daySchema.nullable(),
    friday: daySchema.nullable(),
  }),
});

export const hotlineStaffProfile = z.object({
  email: z.string(),
  displayName: z.string(),
  availabilityProfile: z.object({
    monday: availabilityProfileSchema.nullable(),
    tuesday: availabilityProfileSchema.nullable(),
    wednesday: availabilityProfileSchema.nullable(),
    thursday: availabilityProfileSchema.nullable(),
    friday: availabilityProfileSchema.nullable(),
  }),
  schedulingClass: z.enum(["STANDARD", "RESERVE"]),
  enabled: z.boolean(),

  generatedWeeklySchedule: generatedWeeklySchedule.optional(),
});
