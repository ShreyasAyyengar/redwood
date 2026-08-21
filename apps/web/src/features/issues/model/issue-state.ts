import type { Doc } from "@backend/convex/_generated/dataModel";

export type Issue = Doc<"issues">;
export type IssueState = "ACTIVE" | "ON_HOLD" | "RESOLVED";
export const ISSUE_FINDINGS_OPTIONS = ["NO SYSTEM FAULT"] as const;

export function getIssueState(issue: Issue): IssueState {
  if (issue.resolution) return "RESOLVED";
  if (issue.issue.onHold) return "ON_HOLD";
  return "ACTIVE";
}

export function isActiveIssue(issue: Issue) {
  return getIssueState(issue) === "ACTIVE";
}

export function sortActiveIssues(issues: Issue[]) {
  return [...issues].sort(
    (a, b) => Number(b.issue.urgent) - Number(a.issue.urgent) || Date.parse(a.issue.reportedAt) - Date.parse(b.issue.reportedAt)
  );
}
