import type { Doc } from "@backend/convex/_generated/dataModel";
import { uiIssueFormSchema } from "@backend/convex/core/issues/schemas.ts";
import { z } from "zod";

/**
 * Convex methods expect ISO date strings for date fields. These are utility schemas and methods to handle the conversions
 */
const issueResolutionFormSchema = uiIssueFormSchema.shape.resolution.unwrap().omit({ resolvedAt: true }).extend({
  resolvedAt: z.date(),
});

export const issueFormSchema = uiIssueFormSchema
  .omit({
    reportedAt: true,
    resolution: true,
  })
  .extend({
    reportedAt: z.date().optional(),
    resolution: issueResolutionFormSchema.optional(),
  });

export type IssueFormValues = z.input<typeof issueFormSchema>;

export function getIssueFormValues(issue?: Doc<"issues">): IssueFormValues {
  return {
    description: issue?.issue.description ?? "",
    urgent: issue?.issue.urgent ?? false,
    supervisorNeeded: issue?.issue.supervisorNeeded ?? false,
    cruzfixId: issue?.issue.cruzfixId,
    sodId: issue?.issue.sodId,
    onHold: issue?.issue.onHold ?? false,
    reportedBy: issue?.issue.reportedBy,
    reportedAt: issue ? new Date(issue.issue.reportedAt) : undefined,
    resolution: issue?.resolution
      ? {
          comment: issue.resolution.comment,
          resolvedBy: issue.resolution.resolvedBy,
          resolvedAt: new Date(issue.resolution.resolvedAt),
        }
      : undefined,
  };
}

export function serializeIssueFormValues(values: IssueFormValues) {
  return {
    description: values.description,
    urgent: values.urgent,
    supervisorNeeded: values.supervisorNeeded,
    onHold: values.onHold,
    ...(values.cruzfixId !== undefined ? { cruzfixId: values.cruzfixId } : {}),
    ...(values.sodId !== undefined ? { sodId: values.sodId } : {}),
    ...(values.reportedBy !== undefined ? { reportedBy: values.reportedBy } : {}),
    ...(values.reportedAt ? { reportedAt: values.reportedAt.toISOString() } : {}),
    ...(values.resolution
      ? {
          resolution: {
            ...values.resolution,
            resolvedAt: values.resolution.resolvedAt.toISOString(),
          },
        }
      : {}),
  };
}
