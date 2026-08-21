import { zid } from "convex-helpers/server/zod4";
import z from "zod";

const issueDetailsSchema = z.object({
  reportedBy: z.email("Issue reportedBy must be provided."),
  reportedAt: z.iso.datetime("Issue reportedAt must be provided"),
  description: z.string("Issue description must be provided").min(1, "Issue description must be provided"),
  sodId: z.string().optional(),
  cruzfixId: z.string().optional(),
  urgent: z.boolean(),
  supervisorNeeded: z.boolean(),
  onHold: z.boolean(),
});

const issueEditSchema = z.object({
  editedBy: z.email("Issue edited.editedBy must be provided"),
  editDate: z.iso.datetime("Issue edited.editDate must be provided"),
});

export const FINDINGS_OPTIONS = ["NO SYSTEM FAULT"] as const;
const issueResolutionSchema = z.object({
  resolvedBy: z.email("Issue resolution.resolvedBy must be provided"),
  resolvedAt: z.iso.datetime("Issue resolution.resolvedAt must be provided"),
  comment: z.string("Issue resolution.comment must be provided"),
  findings: z.array(z.enum(FINDINGS_OPTIONS)).optional(), // TOOD migrate and then enable
});

// DB Schema - The complete object as stored in the database
export const issueSchema = z.object({
  classroomId: zid("classrooms"),

  createdBy: z.email(), // non-editable
  createdAt: z.iso.datetime(), // non-editable

  issue: issueDetailsSchema,
  edited: issueEditSchema.optional(),
  resolution: issueResolutionSchema.optional(),

  // Derived fields used to reproduce the issue feed's ordering in one index.
  // UNRESOLVED sorts before RESOLVED when the feed index is read descending.
  feedStatus: z.enum(["UNRESOLVED", "RESOLVED"]),
  feedDate: z.iso.datetime(),
});

export const issueFeedDateRangeFilterSchema = z.object({
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
});

export const issueFeedFilterSchema = z.object({
  classroomId: zid("classrooms").optional(),
  group: z.string().optional(),
  search: z.string().optional(),
  created: issueFeedDateRangeFilterSchema.optional(),
  resolved: issueFeedDateRangeFilterSchema.optional(),
  status: z.enum(["UNRESOLVED", "RESOLVED"]).optional(),
  urgent: z.boolean().optional(),
  supervisorNeeded: z.boolean().optional(),
  hasSodId: z.boolean().optional(),
  hasCruzfixId: z.boolean().optional(),
  hasFindings: z.boolean().optional(),
  onHold: z.boolean().optional(),
});

export const uiIssueFormSchema = z.object({
  description: z.string().min(1, "Issue description must be provided"),
  urgent: z.boolean().default(false),
  supervisorNeeded: z.boolean().default(false),
  cruzfixId: z.string().optional(),
  sodId: z.string().optional(),
  onHold: z.boolean().default(false),

  // edit-specific fields
  reportedBy: z.email().optional(),
  reportedAt: z.iso.datetime().optional(),

  resolution: z
    .object({
      comment: z.string().min(1, "Issue resolution.comment must be provided"),
      resolvedBy: z.email(),
      resolvedAt: z.iso.datetime(),
    })
    .optional(),
});

export const bulkIssueFormSchema = uiIssueFormSchema.extend({
  attributeIds: z.array(zid("attributes")).default([]),
  classroomIds: z.array(zid("classrooms")).default([]),
});
