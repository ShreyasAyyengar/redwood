import { defineTable } from "convex/server";
import { zodOutputToConvex } from "convex-helpers/server/zod";
import { hotlineSettingsSchema } from "./schemas.ts";

export const hotlineSettingsTable = defineTable(zodOutputToConvex(hotlineSettingsSchema)).index("byKey", ["key"]);
