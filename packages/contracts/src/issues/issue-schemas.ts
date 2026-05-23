import z from "zod";
import { attributeSchema } from "../attributes/attributes-schemas";
import { classroomSchema, classroomSchemaPayload } from "../rooms/classroom-contract";

const issueDetailsSchema = z.object({
  reportedBy: z.email("Issue reportedBy must be provided."),
  reportedAt: z.coerce.date("Issue reportedAt must be provided"),
  description: z.string("Issue description must be provided").min(1, "Issue description must be provided"),
  sodId: z.string().optional(),
  cruzfixId: z.string().optional(),
  urgent: z.boolean(),
  supervisorNeeded: z.boolean(),
});

const issueEditSchema = z.object({
  editedBy: z.email("Issue edited.editedBy must be provided"),
  editDate: z.coerce.date("Issue edited.editDate must be provided"),
});

export const FINDINGS_OPTIONS = ["NO SYSTEM FAULT"] as const;
const issueResolutionSchema = z.object({
  resolvedBy: z.email("Issue resolution.resolvedBy must be provided"),
  resolvedAt: z.coerce.date("Issue resolution.resolvedAt must be provided"),
  comment: z.string("Issue resolution.comment must be provided"),
  findings: z.array(z.enum(FINDINGS_OPTIONS)).optional(), // TOOD migrate and then enable
});

// DB Schema - The complete object as stored in the database
export const issueSchema = z.object({
  _id: z.uuidv7(),
  classroomId: z.uuidv7(),

  createdBy: z.email(), // non-editable
  createdAt: z.coerce.date(), // non-editable

  issue: issueDetailsSchema,
  edited: issueEditSchema.optional(),
  resolution: issueResolutionSchema.optional(),
});

export const uiIssueFormSchema = z.object({
  description: z.string().min(1, "Issue description must be provided"),
  urgent: z.boolean().default(false),
  supervisorNeeded: z.boolean().default(false),
  cruzfixId: z.string().optional(),
  sodId: z.string().optional(),

  // edit-specific fields
  reportedBy: z.email().optional(),
  reportedAt: z.coerce.date().optional(),

  resolution: z
    .object({
      comment: z.string().min(1, "Issue resolution.comment must be provided"),
      resolvedBy: z.email(),
      resolvedAt: z.coerce.date(),
    })
    .optional(),
});

export const issueMutationResult = z.object({
  mutatedIssue: issueSchema,
  roomSnapshot: classroomSchemaPayload,
});

export const bulkIssueFormSchema = uiIssueFormSchema.extend({
  attributeIds: z.array(attributeSchema.shape._id).default([]),
  classroomIds: z.array(classroomSchema.shape._id).default([]),
});

export const bulkIssueMutationResult = z.object({
  mutatedIssues: z.array(issueSchema),
  roomSnapshots: z.array(classroomSchemaPayload),
});
