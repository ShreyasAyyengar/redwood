import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";

export const MAX_TEMPLATE_BYTES = 300_000;
export const MAX_RECORD_BYTES = 800_000;
export const MAX_CHECKLIST_FIELDS = 300;

const key = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[\w.-]+$/u);
export const maintenanceResultSchema = z.enum(["pass", "corrected", "follow_up", "blocked", "info", "not_applicable"]);
export const outcomeSchema = z.object({
  result: maintenanceResultSchema,
  followUp: z.enum(["none", "task", "issue"]),
});

// Room selection and each attribute condition combine with AND. Exclusions always win.
export const visibilityRuleSchema = z.object({
  audience: z.enum(["all", "selected"]),
  roomIds: z.array(zid("classrooms")).max(5000),
  excludeRoomIds: z.array(zid("classrooms")).max(5000),
  allAttributeIds: z.array(zid("attributes")).max(100),
  anyAttributeIds: z.array(zid("attributes")).max(100),
  noneAttributeIds: z.array(zid("attributes")).max(100),
});

const fieldBase = {
  id: key,
  label: z.string().max(160),
  helpText: z.string().max(2000),
  enabled: z.boolean(),
  required: z.boolean(),
  visibility: z.object({
    mode: z.enum(["inherit", "restrict", "custom"]),
    rules: visibilityRuleSchema,
  }),
};

export const maintenanceFieldSchema = z.discriminatedUnion("type", [
  z.object({ ...fieldBase, type: z.literal("switch"), trueOutcome: outcomeSchema, falseOutcome: outcomeSchema }),
  z.object({
    ...fieldBase,
    type: z.literal("dropdown"),
    options: z.array(z.object({ id: key, label: z.string().max(160), outcome: outcomeSchema })).max(30),
  }),
  z.object({ ...fieldBase, type: z.literal("text") }),
]);

export const maintenanceSectionSchema = z.object({
  id: key,
  label: z.string().max(160),
  description: z.string().max(2000),
  enabled: z.boolean(),
  visibility: visibilityRuleSchema,
  fields: z.array(maintenanceFieldSchema).max(50),
});
export const maintenanceSectionsSchema = z.array(maintenanceSectionSchema).max(30);

export const maintenanceTemplateSchema = z.object({
  key: z.literal("default"),
  revision: z.number().int().nonnegative(),
  sections: maintenanceSectionsSchema,
  publishedVersionId: zid("maintenanceTemplateVersions").optional(),
  publishedRevision: z.number().int().optional(),
  versionNumber: z.number().int().nonnegative(),
  updatedBy: z.string(),
  updatedAt: z.number(),
});

export const maintenanceTemplateVersionSchema = z.object({
  number: z.number().int().positive(),
  sections: maintenanceSectionsSchema,
  publishedBy: z.string(),
  publishedAt: z.number(),
});

export const maintenanceAnswerSchema = z.object({
  fieldId: key,
  value: z.union([z.boolean(), z.string().max(4000)]),
  taskId: zid("tasks").optional(),
  issueId: zid("issues").optional(),
});
export const evaluatedAnswerSchema = maintenanceAnswerSchema.extend({
  result: maintenanceResultSchema,
  displayValue: z.string(),
});
export const maintenanceSummarySchema = z.object({
  status: z.enum(["clean_pass", "corrective_actions", "blocked", "unscored"]),
  pass: z.number(),
  corrected: z.number(),
  follow_up: z.number(),
  blocked: z.number(),
  info: z.number(),
  not_applicable: z.number(),
});

export const checklistSnapshotSchema = z.object({
  versionId: zid("maintenanceTemplateVersions"),
  versionNumber: z.number(),
  sections: maintenanceSectionsSchema,
  answers: z.array(evaluatedAnswerSchema).max(MAX_CHECKLIST_FIELDS),
  summary: maintenanceSummarySchema,
});

export type VisibilityRule = z.infer<typeof visibilityRuleSchema>;
export type MaintenanceField = z.infer<typeof maintenanceFieldSchema>;
export type MaintenanceSection = z.infer<typeof maintenanceSectionSchema>;
export type MaintenanceOutcome = z.infer<typeof outcomeSchema>;
export type MaintenanceAnswer = z.infer<typeof maintenanceAnswerSchema>;
export type EvaluatedAnswer = z.infer<typeof evaluatedAnswerSchema>;
export type MaintenanceSummary = z.infer<typeof maintenanceSummarySchema>;

export function allRoomsRule(): VisibilityRule {
  return { audience: "all", roomIds: [], excludeRoomIds: [], allAttributeIds: [], anyAttributeIds: [], noneAttributeIds: [] };
}
