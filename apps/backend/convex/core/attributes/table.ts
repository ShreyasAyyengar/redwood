import { defineTable } from "convex/server";
import { zodOutputToConvex } from "convex-helpers/server/zod";
import { attributeSchema } from "./schemas.ts";

export const attributeTable = defineTable(zodOutputToConvex(attributeSchema)).index("byLabel", ["label"]);
