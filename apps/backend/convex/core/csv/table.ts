import { defineTable } from "convex/server";
import { zodOutputToConvex } from "convex-helpers/server/zod";
import { csvRecordSchema } from "./schemas.ts";

export const csvRecordTable = defineTable(zodOutputToConvex(csvRecordSchema)).index("byDateUploaded", ["dateUploaded"]);
