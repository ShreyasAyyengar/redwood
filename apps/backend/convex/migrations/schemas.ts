import { z } from "zod";
import { attributeSchema } from "../core/attributes/schemas.ts";
import { classroomSchema } from "../core/classrooms/schemas.ts";
import { groupSchema } from "../core/groups/schemas.ts";
import { issueSchema } from "../core/issues/schemas.ts";
import { maintenanceEntrySchema } from "../core/maintenance/schemas.ts";
import { taskSchema } from "../core/tasks/schemas.ts";

const migrationMetadataSchema = z.object({
  legacyId: z.string(),
  sourceHash: z.string(),
});

export const attributeImportSchema = attributeSchema.extend(migrationMetadataSchema.shape);
export const groupImportSchema = groupSchema.extend(migrationMetadataSchema.shape);
export const classroomImportSchema = classroomSchema.omit({ attributes: true }).extend({
  ...migrationMetadataSchema.shape,
  legacyAttributeIds: z.array(z.string()),
});
export const issueImportSchema = issueSchema.omit({ classroomId: true }).extend({
  ...migrationMetadataSchema.shape,
  legacyClassroomId: z.string(),
});
export const taskImportSchema = taskSchema.omit({ classroomId: true }).extend({
  ...migrationMetadataSchema.shape,
  legacyClassroomId: z.string(),
});
export const maintenanceImportSchema = maintenanceEntrySchema.omit({ classroomId: true }).extend({
  ...migrationMetadataSchema.shape,
  legacyClassroomId: z.string(),
});
