import { defineTable } from "convex/server";
import { zodOutputToConvex } from "convex-helpers/server/zod";
import { hotlineCategory, hotlineEntry } from "./schemas.ts";

export const hotlineTable = defineTable(zodOutputToConvex(hotlineEntry));
export const hotlineCategoryTable = defineTable(zodOutputToConvex(hotlineCategory)).index("byLabel", ["label"]);
