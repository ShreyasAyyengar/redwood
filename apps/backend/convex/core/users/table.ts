import { defineTable } from "convex/server";
import { zodOutputToConvex } from "convex-helpers/server/zod";
import { redwoodUserSchema } from "./schemas.ts";

export const redwoodUserTable = defineTable(zodOutputToConvex(redwoodUserSchema)).index("byEmail", ["email"]);
