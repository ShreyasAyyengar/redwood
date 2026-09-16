import { defineTable } from "convex/server";
import { zodOutputToConvex } from "convex-helpers/server/zod";
import { hotlineScheduleStateSchema, hotlineStaffProfile } from "./schemas.ts";

export const hotlineProfileTable = defineTable(zodOutputToConvex(hotlineStaffProfile)).index("byEmail", ["email"]);

export const hotlineScheduleStateTable = defineTable(zodOutputToConvex(hotlineScheduleStateSchema)).index("byKey", ["key"]);
