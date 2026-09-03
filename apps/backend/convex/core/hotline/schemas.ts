import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";

export const hotlineEntry = z.object({
  dateOfCall: z.iso.datetime(),
  takenBy: z.string(),
  callerLocation: z.union([z.string(), zid("classrooms")]),
  callerIssueDescription: z.string(),
  callerIdentifier: z.string(), // CruzID, phone number, email, name, etc
  department: z.enum(["INSTRUCTION", "EVENTS"]),
  calleeResolution: z.string(),
  hotlineCategory: zid("hotlineCategories"),
  serviceLocation: z.enum(["ON-SITE", "PHONE"]),
});

export const hotlineCategory = z.object({
  label: z.string(),
});

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
