/** biome-ignore-all lint/style/useFilenamingConvention: keep the Convex function path explicit for the migration CLI */

import { z } from "zod";
import type { Id, TableNames } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { internalMutation, internalQuery } from "../lib/procedures.ts";
import {
  attributeImportSchema,
  classroomImportSchema,
  groupImportSchema,
  issueImportSchema,
  maintenanceImportSchema,
  taskImportSchema,
} from "./schemas.ts";
import type { mongoMigrationCollectionSchema } from "./table.ts";

const importResultSchema = z.object({
  inserted: z.number(),
  skipped: z.number(),
});

type MigrationCollection = z.infer<typeof mongoMigrationCollectionSchema>;

async function findMapping(ctx: MutationCtx, collection: MigrationCollection, legacyId: string) {
  return await ctx.db
    .query("mongoMigrationIds")
    .withIndex("byCollectionAndLegacyId", (query) => query.eq("collection", collection).eq("legacyId", legacyId))
    .unique();
}

async function mappedId<TableName extends TableNames>(
  ctx: MutationCtx,
  collection: MigrationCollection,
  legacyId: string,
  table: TableName
): Promise<Id<TableName>> {
  const mapping = await findMapping(ctx, collection, legacyId);
  if (!mapping) throw new Error(`No ${collection} mapping exists for legacy ID ${legacyId}`);

  const targetId = ctx.db.normalizeId(table, mapping.targetId);
  if (!targetId) throw new Error(`Mapping ${collection}/${legacyId} does not contain a valid ${table} ID`);

  const target = await ctx.db.get(targetId);
  if (!target) throw new Error(`Mapping ${collection}/${legacyId} points to a missing ${table} document`);
  return targetId;
}

async function skipExistingOrThrow(ctx: MutationCtx, collection: MigrationCollection, legacyId: string, sourceHash: string) {
  const existing = await findMapping(ctx, collection, legacyId);
  if (!existing) return false;
  if (existing.sourceHash !== sourceHash) {
    throw new Error(
      `Source document ${collection}/${legacyId} changed since it was migrated. ` +
        "Use the same export to resume, or remove the existing migration deliberately."
    );
  }

  const targetId = ctx.db.normalizeId(collection, existing.targetId);
  if (!targetId || !(await ctx.db.get(targetId))) {
    throw new Error(`Mapping ${collection}/${legacyId} points to a missing or invalid target document`);
  }
  return true;
}

async function saveMapping(ctx: MutationCtx, collection: MigrationCollection, legacyId: string, targetId: string, sourceHash: string) {
  await ctx.db.insert("mongoMigrationIds", { collection, legacyId, targetId, sourceHash });
}

export const preflight = internalQuery({
  args: z.object({}),
  returns: z.object({
    mappings: z.number(),
    targetCounts: z.object({
      attributes: z.number(),
      groups: z.number(),
      classrooms: z.number(),
      issues: z.number(),
      tasks: z.number(),
      maintenance: z.number(),
    }),
  }),
  handler: async (ctx) => {
    const [mappings, attributes, groups, classrooms, issues, tasks, maintenance] = await Promise.all([
      ctx.db.query("mongoMigrationIds").collect(),
      ctx.db.query("attributes").collect(),
      ctx.db.query("groups").collect(),
      ctx.db.query("classrooms").collect(),
      ctx.db.query("issues").collect(),
      ctx.db.query("tasks").collect(),
      ctx.db.query("maintenance").collect(),
    ]);

    return {
      mappings: mappings.length,
      targetCounts: {
        attributes: attributes.length,
        groups: groups.length,
        classrooms: classrooms.length,
        issues: issues.length,
        tasks: tasks.length,
        maintenance: maintenance.length,
      },
    };
  },
});

export const importAttributes = internalMutation({
  args: z.object({ rows: z.array(attributeImportSchema) }),
  returns: importResultSchema,
  handler: async (ctx, { rows }) => {
    let inserted = 0;
    let skipped = 0;
    for (const { legacyId, sourceHash, ...attribute } of rows) {
      if (await skipExistingOrThrow(ctx, "attributes", legacyId, sourceHash)) {
        skipped += 1;
        continue;
      }
      const targetId = await ctx.db.insert("attributes", attribute);
      await saveMapping(ctx, "attributes", legacyId, targetId, sourceHash);
      inserted += 1;
    }
    return { inserted, skipped };
  },
});

export const importGroups = internalMutation({
  args: z.object({ rows: z.array(groupImportSchema) }),
  returns: importResultSchema,
  handler: async (ctx, { rows }) => {
    let inserted = 0;
    let skipped = 0;
    for (const { legacyId, sourceHash, ...group } of rows) {
      if (await skipExistingOrThrow(ctx, "groups", legacyId, sourceHash)) {
        skipped += 1;
        continue;
      }
      const targetId = await ctx.db.insert("groups", group);
      await saveMapping(ctx, "groups", legacyId, targetId, sourceHash);
      inserted += 1;
    }
    return { inserted, skipped };
  },
});

export const importClassrooms = internalMutation({
  args: z.object({ rows: z.array(classroomImportSchema) }),
  returns: importResultSchema,
  handler: async (ctx, { rows }) => {
    let inserted = 0;
    let skipped = 0;
    for (const { legacyId, sourceHash, legacyAttributeIds, ...classroom } of rows) {
      if (await skipExistingOrThrow(ctx, "classrooms", legacyId, sourceHash)) {
        skipped += 1;
        continue;
      }

      const attributes = await Promise.all(legacyAttributeIds.map((attributeId) => mappedId(ctx, "attributes", attributeId, "attributes")));
      const targetId = await ctx.db.insert("classrooms", { ...classroom, attributes });
      await saveMapping(ctx, "classrooms", legacyId, targetId, sourceHash);
      inserted += 1;
    }
    return { inserted, skipped };
  },
});

export const importIssues = internalMutation({
  args: z.object({ rows: z.array(issueImportSchema) }),
  returns: importResultSchema,
  handler: async (ctx, { rows }) => {
    let inserted = 0;
    let skipped = 0;
    for (const { legacyId, sourceHash, legacyClassroomId, ...issue } of rows) {
      if (await skipExistingOrThrow(ctx, "issues", legacyId, sourceHash)) {
        skipped += 1;
        continue;
      }
      const classroomId = await mappedId(ctx, "classrooms", legacyClassroomId, "classrooms");
      const targetId = await ctx.db.insert("issues", { ...issue, classroomId });
      await saveMapping(ctx, "issues", legacyId, targetId, sourceHash);
      inserted += 1;
    }
    return { inserted, skipped };
  },
});

export const importTasks = internalMutation({
  args: z.object({ rows: z.array(taskImportSchema) }),
  returns: importResultSchema,
  handler: async (ctx, { rows }) => {
    let inserted = 0;
    let skipped = 0;
    for (const { legacyId, sourceHash, legacyClassroomId, ...task } of rows) {
      if (await skipExistingOrThrow(ctx, "tasks", legacyId, sourceHash)) {
        skipped += 1;
        continue;
      }
      const classroomId = await mappedId(ctx, "classrooms", legacyClassroomId, "classrooms");
      const targetId = await ctx.db.insert("tasks", { ...task, classroomId });
      await saveMapping(ctx, "tasks", legacyId, targetId, sourceHash);
      inserted += 1;
    }
    return { inserted, skipped };
  },
});

export const importMaintenance = internalMutation({
  args: z.object({ rows: z.array(maintenanceImportSchema) }),
  returns: importResultSchema,
  handler: async (ctx, { rows }) => {
    let inserted = 0;
    let skipped = 0;
    for (const { legacyId, sourceHash, legacyClassroomId, ...entry } of rows) {
      if (await skipExistingOrThrow(ctx, "maintenance", legacyId, sourceHash)) {
        skipped += 1;
        continue;
      }
      const classroomId = await mappedId(ctx, "classrooms", legacyClassroomId, "classrooms");
      const targetId = await ctx.db.insert("maintenance", { ...entry, classroomId });
      await saveMapping(ctx, "maintenance", legacyId, targetId, sourceHash);
      inserted += 1;
    }
    return { inserted, skipped };
  },
});

export const audit = internalQuery({
  args: z.object({}),
  handler: async (ctx) => {
    const [mappings, attributes, groups, classrooms, issues, tasks, maintenance] = await Promise.all([
      ctx.db.query("mongoMigrationIds").collect(),
      ctx.db.query("attributes").collect(),
      ctx.db.query("groups").collect(),
      ctx.db.query("classrooms").collect(),
      ctx.db.query("issues").collect(),
      ctx.db.query("tasks").collect(),
      ctx.db.query("maintenance").collect(),
    ]);

    const mappingCounts: Record<MigrationCollection, number> = {
      attributes: 0,
      groups: 0,
      classrooms: 0,
      issues: 0,
      tasks: 0,
      maintenance: 0,
    };
    for (const mapping of mappings) mappingCounts[mapping.collection] += 1;

    const classroomIds = new Set(classrooms.map((classroom) => classroom._id));
    const attributeIds = new Set(attributes.map((attribute) => attribute._id));
    const latestMaintenance = new Map<Id<"classrooms">, (typeof maintenance)[number]>();
    for (const entry of maintenance) {
      const latest = latestMaintenance.get(entry.classroomId);
      if (!latest || entry.date > latest.date) latestMaintenance.set(entry.classroomId, entry);
    }

    return {
      targetCounts: {
        attributes: attributes.length,
        groups: groups.length,
        classrooms: classrooms.length,
        issues: issues.length,
        tasks: tasks.length,
        maintenance: maintenance.length,
      },
      mappingCounts,
      unresolvedReferences: {
        classroomAttributes: classrooms.reduce(
          (count, classroom) => count + classroom.attributes.filter((attributeId) => !attributeIds.has(attributeId)).length,
          0
        ),
        issues: issues.filter((issue) => !classroomIds.has(issue.classroomId)).length,
        tasks: tasks.filter((task) => !classroomIds.has(task.classroomId)).length,
        maintenance: maintenance.filter((entry) => !classroomIds.has(entry.classroomId)).length,
      },
      issueStatuses: {
        resolved: issues.filter((issue) => issue.feedStatus === "RESOLVED").length,
        unresolved: issues.filter((issue) => issue.feedStatus === "UNRESOLVED").length,
      },
      taskStatuses: {
        completed: tasks.filter((task) => task.feedStatus === "COMPLETED").length,
        open: tasks.filter((task) => task.feedStatus === "OPEN").length,
      },
      derivedFieldMismatches: {
        issueFeed: issues.filter(
          (issue) =>
            issue.feedStatus !== (issue.resolution ? "RESOLVED" : "UNRESOLVED") ||
            issue.feedDate !== (issue.resolution?.resolvedAt ?? issue.issue.reportedAt)
        ).length,
        taskFeed: tasks.filter(
          (task) =>
            task.feedStatus !== (task.completion ? "COMPLETED" : "OPEN") ||
            task.feedDate !== (task.completion?.completedAt ?? task.task.createdAt)
        ).length,
        lastMaintenance: classrooms.filter((classroom) => {
          const latest = latestMaintenance.get(classroom._id);
          if (!latest) return classroom.lastMaintenance !== undefined;
          return classroom.lastMaintenance?.date !== latest.date || classroom.lastMaintenance?.by !== latest.completedBy;
        }).length,
      },
    };
  },
});
