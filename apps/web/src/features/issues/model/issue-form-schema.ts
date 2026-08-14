import type { Doc } from "@backend/convex/_generated/dataModel";
import { z } from "zod";

export const issueFormSchema = z.object({
  description: z.string().min(1, "Issue description must be provided"),
  urgent: z.boolean(),
  supervisorNeeded: z.boolean(),
  cruzfixId: z.string().optional(),
  sodId: z.string().optional(),
  onHold: z.boolean(),
  reportedBy: z.email().optional(),
  reportedAt: z.date().optional(),
  resolution: z
    .object({
      comment: z.string().min(1, "Issue resolution.comment must be provided"),
      resolvedBy: z.email(),
      resolvedAt: z.date(),
    })
    .optional(),
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
