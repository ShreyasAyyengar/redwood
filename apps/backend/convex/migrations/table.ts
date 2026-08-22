import { defineTable } from "convex/server";
import { zodOutputToConvex } from "convex-helpers/server/zod";
import { z } from "zod";

export const mongoMigrationCollectionSchema = z.enum(["attributes", "groups", "classrooms", "issues", "tasks", "maintenance"]);

export const mongoMigrationIdSchema = z.object({
  collection: mongoMigrationCollectionSchema,
  legacyId: z.string(),
  targetId: z.string(),
  sourceHash: z.string(),
});

export const mongoMigrationIdTable = defineTable(zodOutputToConvex(mongoMigrationIdSchema)).index("byCollectionAndLegacyId", [
  "collection",
  "legacyId",
]);
