import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";

export const departments = z.enum(["INSTRUCTION", "EVENTS", "HELP DESK", "OTHER"]);

export const hotlineEntry = z.object({
  dateOfCall: z.iso.datetime(),
  takenBy: z.string(),
  callerLocation: z.union([z.string(), zid("classrooms")]),
  callerIssueDescription: z.string(),
  callerIdentifier: z.string(), // CruzID, phone number, email, name, etc
  department: departments,
  calleeResolution: z.string(),
  hotlineCategory: zid("hotlineCategories"),
  serviceLocation: z.enum(["ON-SITE", "PHONE"]),
});

export const hotlineCategory = z.object({
  label: z.string(),
});
