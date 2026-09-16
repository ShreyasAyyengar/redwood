import { z } from "zod";

export const timeRangeSchema = z.object({
  start: z.iso.time(),
  end: z.iso.time(),
});

export const availabilityProfileSchema = z.object({
  shift: timeRangeSchema,
  blockages: z.array(timeRangeSchema),
});

export const generatedDayScheduleSchema = z.object({
  breaks: z.array(timeRangeSchema),
  available: z.array(timeRangeSchema),
  lastAvailable: z.array(timeRangeSchema),
  solo: z.array(timeRangeSchema),
});

export const generatedWeeklyScheduleSchema = z.object({
  generatedAt: z.number().optional(),
  generatedFromVersion: z.number().int().nonnegative().optional(),
  schedule: z.object({
    monday: generatedDayScheduleSchema.nullable(),
    tuesday: generatedDayScheduleSchema.nullable(),
    wednesday: generatedDayScheduleSchema.nullable(),
    thursday: generatedDayScheduleSchema.nullable(),
    friday: generatedDayScheduleSchema.nullable(),
  }),
});

export const weeklyAvailabilityProfileSchema = z.object({
  monday: availabilityProfileSchema.nullable(),
  tuesday: availabilityProfileSchema.nullable(),
  wednesday: availabilityProfileSchema.nullable(),
  thursday: availabilityProfileSchema.nullable(),
  friday: availabilityProfileSchema.nullable(),
});

export const hotlineStaffProfile = z.object({
  email: z.string(),
  displayName: z.string(),
  availabilityProfile: weeklyAvailabilityProfileSchema,
  schedulingClass: z.enum(["STANDARD", "RESERVE"]),
  enabled: z.boolean(),

  generatedWeeklySchedule: generatedWeeklyScheduleSchema.optional(),
});

export const hotlineScheduleStateSchema = z.object({
  key: z.literal("current"),
  inputVersion: z.number().int().nonnegative(),
  publishedVersion: z.number().int().nonnegative(),
  status: z.enum(["PENDING", "SOLVING", "READY", "INFEASIBLE", "FAILED"]),
  scheduledFunctionId: z.string().nullable(),
  startedAt: z.number().nullable(),
  completedAt: z.number().nullable(),
  error: z.string().nullable(),
});
