import { paginationOptsValidator } from "convex/server";
import { ConvexError } from "convex/values";
import { convexToZod, withSystemFields, zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import type { QueryCtx } from "../../_generated/server";
import { authComponent } from "../../auth.ts";
import { protectedMutation, protectedQuery, supervisorMutation, supervisorQuery } from "../../lib/procedures.ts";
import { checklistContext, evaluateAnswers, resolveChecklist, serializedBytes, summarizeAnswers, validateChecklist } from "./checklist";
import { starterChecklist } from "./defaults";
import {
  type EvaluatedAnswer,
  MAX_CHECKLIST_FIELDS,
  MAX_RECORD_BYTES,
  MAX_TEMPLATE_BYTES,
  type MaintenanceSection,
  maintenanceAnswerSchema,
  maintenanceSectionsSchema,
} from "./definitions";
import { maintenanceEntrySchema, maintenanceFormSchema } from "./schemas.ts";

export const maintenanceEntryDoc = z.object(withSystemFields("maintenance", maintenanceEntrySchema.shape));

export const addMaintenanceEntry = protectedMutation({
  args: maintenanceFormSchema.extend({
    classroomId: zid("classrooms"),
  }),
  returns: z.boolean(),
  handler: async (ctx, args) => {
    const template = await getTemplate(ctx);
    if (template?.publishedVersionId)
      throw new ConvexError({ code: "CONFLICT", message: "The maintenance checklist has changed. Close and reopen this form." });
    const classroom = await ctx.db.get("classrooms", args.classroomId);
    if (!classroom) throw new ConvexError({ code: "NOT_FOUND", message: `Classroom with id ${args.classroomId} not found` });
    if (!classroom.isActive) throw new ConvexError({ code: "UNPROCESSABLE_CONTENT", message: `Classroom ${args.classroomId} is not active.` });

    const user = await authComponent.getAuthUser(ctx);
    if (!classroom.lastMaintenance || args.date >= classroom.lastMaintenance.date)
      await ctx.db.patch("classrooms", args.classroomId, {
        lastMaintenance: {
          date: args.date,
          by: user.email,
        },
      });
    await ctx.db.insert("maintenance", {
      ...args,
      completedBy: user.email,
    });

    return true;
  },
});

function getTemplate(ctx: Pick<QueryCtx, "db">) {
  return ctx.db
    .query("maintenanceTemplates")
    .withIndex("byKey", (q) => q.eq("key", "default"))
    .unique();
}

function invalid(message: string): never {
  throw new ConvexError({ code: "UNPROCESSABLE_CONTENT", message });
}

async function validateReferences(ctx: Pick<QueryCtx, "db">, sections: MaintenanceSection[]) {
  const rules = sections.flatMap((section) => [section.visibility, ...section.fields.map((field) => field.visibility.rules)]);
  const attributeIds = new Set(rules.flatMap((rule) => [...rule.allAttributeIds, ...rule.anyAttributeIds, ...rule.noneAttributeIds]));
  for (const id of attributeIds) {
    if (!(await ctx.db.get("attributes", id))) invalid("A visibility rule references a deleted room attribute. Update it before publishing.");
  }
  const roomIds = new Set(rules.flatMap((rule) => [...rule.roomIds, ...rule.excludeRoomIds]));
  for (const id of roomIds) {
    if (!(await ctx.db.get("classrooms", id))) invalid("A visibility rule references a deleted room. Update it before publishing.");
  }
}

export const getTemplateEditor = supervisorQuery({
  args: z.object({}),
  handler: async (ctx) => {
    const template = await getTemplate(ctx);
    return {
      revision: template?.revision ?? 0,
      sections: template?.sections ?? starterChecklist(await ctx.db.query("attributes").collect()),
      versionNumber: template?.versionNumber ?? 0,
      publishedRevision: template?.publishedRevision,
    };
  },
});

export const saveTemplateDraft = supervisorMutation({
  args: z.object({ expectedRevision: z.number().int().nonnegative(), sections: maintenanceSectionsSchema }),
  returns: z.number(),
  handler: async (ctx, args) => {
    const template = await getTemplate(ctx);
    if ((template?.revision ?? 0) !== args.expectedRevision)
      throw new ConvexError({ code: "CONFLICT", message: "Another administrator changed this draft. Reload it before saving." });
    if (serializedBytes(args.sections) > MAX_TEMPLATE_BYTES || args.sections.flatMap((section) => section.fields).length > MAX_CHECKLIST_FIELDS)
      invalid("The checklist is too large. Use at most 300 fields and shorten the instructions.");
    const user = await authComponent.getAuthUser(ctx);
    const update = { sections: args.sections, revision: args.expectedRevision + 1, updatedBy: user.email, updatedAt: Date.now() };
    if (template) await ctx.db.patch("maintenanceTemplates", template._id, update);
    else await ctx.db.insert("maintenanceTemplates", { key: "default", versionNumber: 0, ...update });
    return update.revision;
  },
});

export const publishTemplate = supervisorMutation({
  args: z.object({ expectedRevision: z.number().int().nonnegative() }),
  returns: z.number(),
  handler: async (ctx, args) => {
    const template = await getTemplate(ctx);
    if (!template || template.revision !== args.expectedRevision)
      throw new ConvexError({ code: "CONFLICT", message: "The draft changed. Save or reload your changes before publishing." });
    if (template.publishedRevision === template.revision) return template.versionNumber;
    const errors = validateChecklist(template.sections);
    if (errors.length) invalid(errors.join("\n"));
    await validateReferences(ctx, template.sections);
    const user = await authComponent.getAuthUser(ctx);
    const versionNumber = template.versionNumber + 1;
    const versionId = await ctx.db.insert("maintenanceTemplateVersions", {
      number: versionNumber,
      sections: template.sections,
      publishedBy: user.email,
      publishedAt: Date.now(),
    });
    await ctx.db.patch("maintenanceTemplates", template._id, {
      publishedVersionId: versionId,
      publishedRevision: template.revision,
      versionNumber,
    });
    return versionNumber;
  },
});

export const getChecklist = protectedQuery({
  args: z.object({ classroomId: zid("classrooms") }),
  handler: async (ctx, args) => {
    const room = await ctx.db.get("classrooms", args.classroomId);
    if (!room?.isActive) invalid("This classroom is unavailable for maintenance.");
    const template = await getTemplate(ctx);
    if (!template?.publishedVersionId) return null;
    const version = await ctx.db.get("maintenanceTemplateVersions", template.publishedVersionId);
    if (!version) invalid("The published maintenance checklist is unavailable.");
    return {
      versionId: version._id,
      versionNumber: version.number,
      context: checklistContext(room),
      sections: resolveChecklist(version.sections, room),
    };
  },
});

export const submitChecklist = protectedMutation({
  args: z.object({
    classroomId: zid("classrooms"),
    date: z.iso.datetime(),
    versionId: zid("maintenanceTemplateVersions"),
    context: z.string(),
    answers: z.array(maintenanceAnswerSchema).max(MAX_CHECKLIST_FIELDS),
  }),
  returns: z.boolean(),
  handler: async (ctx, args) => {
    const room = await ctx.db.get("classrooms", args.classroomId);
    if (!room?.isActive) invalid("This classroom is unavailable for maintenance.");
    const template = await getTemplate(ctx);
    if (template?.publishedVersionId !== args.versionId || checklistContext(room) !== args.context)
      throw new ConvexError({
        code: "CONFLICT",
        message: "The checklist or room attributes changed. Refresh the checklist and review your answers.",
      });
    const version = await ctx.db.get("maintenanceTemplateVersions", args.versionId);
    if (!version) invalid("The maintenance checklist is unavailable.");
    const sections = resolveChecklist(version.sections, room);
    let answers: EvaluatedAnswer[];
    try {
      answers = evaluateAnswers(sections, args.answers);
    } catch (error) {
      invalid(error instanceof Error ? error.message : "Invalid maintenance answers.");
    }
    for (const answer of answers) {
      if (answer.taskId) {
        const task = await ctx.db.get("tasks", answer.taskId);
        if (!task || task.classroomId !== room._id) invalid("A linked task does not belong to this classroom.");
      }
      if (answer.issueId) {
        const issue = await ctx.db.get("issues", answer.issueId);
        if (!issue || issue.classroomId !== room._id) invalid("A linked issue does not belong to this classroom.");
      }
    }
    const user = await authComponent.getAuthUser(ctx);
    const snapshot = { versionId: version._id, versionNumber: version.number, sections, answers, summary: summarizeAnswers(answers) };
    if (serializedBytes(snapshot) > MAX_RECORD_BYTES)
      invalid("This maintenance record is too large. Shorten the text answers before submitting.");
    await ctx.db.insert("maintenance", {
      classroomId: room._id,
      date: args.date,
      completedBy: user.email,
      checklist: snapshot,
    });
    if (!room.lastMaintenance || args.date >= room.lastMaintenance.date)
      await ctx.db.patch("classrooms", room._id, { lastMaintenance: { date: args.date, by: user.email } });
    return true;
  },
});

export const getHistory = protectedQuery({
  args: z.object({
    classroomId: zid("classrooms"),
    paginationOpts: convexToZod(paginationOptsValidator),
  }),
  handler: (ctx, args) =>
    ctx.db
      .query("maintenance")
      .withIndex("byClassroomIdAndDate", (query) => query.eq("classroomId", args.classroomId))
      .order("desc")
      .paginate(args.paginationOpts),
});
