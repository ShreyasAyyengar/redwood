import { defineTable } from "convex/server";
import { zodOutputToConvex } from "convex-helpers/server/zod";
import { groupSchema } from "./schemas.ts";

export const groupTable = defineTable(zodOutputToConvex(groupSchema)).index("byLabel", ["label"]);
