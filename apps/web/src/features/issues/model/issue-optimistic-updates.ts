import { api } from "@backend/convex/_generated/api";
import type { Doc, Id } from "@backend/convex/_generated/dataModel";
import type { OptimisticLocalStore } from "convex/browser";
import type { FunctionArgs } from "convex/server";

type CreateIssueArgs = FunctionArgs<typeof api.core.issues.service.createIssue>;
type EditIssueArgs = FunctionArgs<typeof api.core.issues.service.editIssue>;
type IssueFeedQueryArgs = Omit<FunctionArgs<typeof api.core.issues.service.getIssues>, "paginationOpts">;

type OptimisticIssueUser = {
  email: string;
  isAdmin: boolean;
  roomGroupKey?: string;
};

function isInDateRange(value: string | undefined, range: { from?: string; to?: string } | undefined) {
  if (!range) return true;
  if (!value) return false;

  const valueTime = Date.parse(value);
  if (range.from && valueTime < Date.parse(range.from)) return false;
  if (range.to) {
    const end = new Date(range.to);
    end.setUTCDate(end.getUTCDate() + 1);
    if (valueTime >= end.getTime()) return false;
  }

  return true;
}

function matchesScope(issue: Doc<"issues">, filters: NonNullable<IssueFeedQueryArgs["filters"]>, roomGroupKey: string | undefined) {
  if (filters.classroomId) return issue.classroomId === filters.classroomId;
  return !filters.group || filters.group === roomGroupKey;
}

function matchesState(issue: Doc<"issues">, filters: NonNullable<IssueFeedQueryArgs["filters"]>) {
  const isResolved = issue.resolution !== undefined;
  if (filters.status && isResolved !== (filters.status === "RESOLVED")) return false;
  if (filters.onHold !== undefined && issue.issue.onHold !== filters.onHold) return false;
  return isInDateRange(issue.issue.reportedAt, filters.created) && isInDateRange(issue.resolution?.resolvedAt, filters.resolved);
}

function matchesFlags(issue: Doc<"issues">, filters: NonNullable<IssueFeedQueryArgs["filters"]>) {
  if (filters.urgent && !issue.issue.urgent) return false;
  if (filters.supervisorNeeded && !issue.issue.supervisorNeeded) return false;
  if (filters.hasSodId && !issue.issue.sodId?.trim()) return false;
  if (filters.hasCruzfixId && !issue.issue.cruzfixId?.trim()) return false;
  return !(filters.hasFindings && !issue.resolution?.findings?.length);
}

function matchesSearch(issue: Doc<"issues">, filters: NonNullable<IssueFeedQueryArgs["filters"]>) {
  const search = filters.search?.trim().toLocaleLowerCase();
  if (!search) return true;
  return (
    issue.issue.description.toLocaleLowerCase().includes(search) || (issue.resolution?.comment.toLocaleLowerCase().includes(search) ?? false)
  );
}

function issueMatchesFeed(issue: Doc<"issues">, { filters, view }: IssueFeedQueryArgs, roomGroupKey: string | undefined) {
  const isActive = issue.resolution === undefined && !issue.issue.onHold;
  if (view === "ACTIVE" && !isActive) return false;
  if (!filters) return true;
  return (
    matchesScope(issue, filters, roomGroupKey) && matchesState(issue, filters) && matchesFlags(issue, filters) && matchesSearch(issue, filters)
  );
}

function updateClassroomIssues(localStore: OptimisticLocalStore, issue: Doc<"issues">, previousIssue: Doc<"issues"> | undefined) {
  const queryArgs = { classroomId: issue.classroomId };
  const issues = localStore.getQuery(api.core.issues.service.getClassroomIssues, queryArgs);
  if (!issues) return;

  const nextIssues = previousIssue ? issues.map((item) => (item._id === issue._id ? issue : item)) : [issue, ...issues];
  localStore.setQuery(api.core.issues.service.getClassroomIssues, queryArgs, nextIssues);
  return nextIssues;
}

function updateIssueFeedQueries(
  localStore: OptimisticLocalStore,
  issue: Doc<"issues">,
  previousIssue: Doc<"issues"> | undefined,
  roomGroupKey: string | undefined
) {
  for (const query of localStore.getAllQueries(api.core.issues.service.getIssues)) {
    if (!query.value) continue;

    const queryArgs: IssueFeedQueryArgs = query.args.filters
      ? { view: query.args.view, filters: query.args.filters }
      : { view: query.args.view };
    const didMatch = previousIssue ? issueMatchesFeed(previousIssue, queryArgs, roomGroupKey) : false;
    const doesMatch = issueMatchesFeed(issue, queryArgs, roomGroupKey);
    const containsIssue = query.value.page.some((item) => item._id === issue._id);

    if (containsIssue) {
      localStore.setQuery(api.core.issues.service.getIssues, query.args, {
        ...query.value,
        page: doesMatch
          ? query.value.page.map((item) => (item._id === issue._id ? issue : item))
          : query.value.page.filter((item) => item._id !== issue._id),
      });
    } else if (!didMatch && doesMatch && query.args.paginationOpts.cursor === null) {
      localStore.setQuery(api.core.issues.service.getIssues, query.args, { ...query.value, page: [issue, ...query.value.page] });
    }
  }
}

function updateIssueRoomSummaries(localStore: OptimisticLocalStore, classroomId: Id<"classrooms">, issues: Doc<"issues">[]) {
  const activeIssues = issues.filter((item) => !item.resolution && !item.issue.onHold);
  const activeIssuesCount = activeIssues.length;
  const roomStatus = activeIssues.some((item) => item.issue.urgent)
    ? "NEEDS URGENT ATTENTION"
    : activeIssuesCount > 0
      ? "NEEDS ATTENTION"
      : issues.some((item) => !item.resolution)
        ? "ON HOLD"
        : "GOOD";

  const room = localStore.getQuery(api.core.classrooms.service.getRoom, { id: classroomId });
  if (room) localStore.setQuery(api.core.classrooms.service.getRoom, { id: classroomId }, { ...room, activeIssuesCount, roomStatus });

  const rooms = localStore.getQuery(api.core.classrooms.service.getAllRooms, {});
  if (!rooms) return;
  localStore.setQuery(
    api.core.classrooms.service.getAllRooms,
    {},
    rooms.map((item) => (item._id === classroomId ? { ...item, activeIssuesCount, roomStatus } : item))
  );
}

function updateIssueCaches(
  localStore: OptimisticLocalStore,
  issue: Doc<"issues">,
  previousIssue: Doc<"issues"> | undefined,
  roomGroupKey?: string
) {
  const classroomIssues = updateClassroomIssues(localStore, issue, previousIssue);
  updateIssueFeedQueries(localStore, issue, previousIssue, roomGroupKey);
  if (classroomIssues) updateIssueRoomSummaries(localStore, issue.classroomId, classroomIssues);
}

export function optimisticallyCreateIssue(localStore: OptimisticLocalStore, args: CreateIssueArgs, user: OptimisticIssueUser) {
  const now = new Date().toISOString();
  const issue: Doc<"issues"> = {
    _id: crypto.randomUUID() as Id<"issues">,
    _creationTime: Date.now(),
    createdAt: now,
    createdBy: user.email,
    classroomId: args.classroomId as Id<"classrooms">,
    issue: {
      description: args.description,
      urgent: args.urgent ?? false,
      supervisorNeeded: args.supervisorNeeded ?? false,
      cruzfixId: args.cruzfixId,
      sodId: args.sodId,
      onHold: args.onHold ?? false,
      reportedBy: user.email,
      reportedAt: now,
    },
    feedStatus: "UNRESOLVED",
    feedDate: now,
  };

  updateIssueCaches(localStore, issue, undefined, user.roomGroupKey);
}

export function optimisticallyEditIssue(
  localStore: OptimisticLocalStore,
  args: EditIssueArgs,
  existingIssue: Doc<"issues">,
  user: OptimisticIssueUser
) {
  const now = new Date().toISOString();
  const onHold = args.onHold ?? false;
  const reportedBy = user.isAdmin ? (args.reportedBy ?? existingIssue.issue.reportedBy) : existingIssue.issue.reportedBy;
  const reportedAt = user.isAdmin ? (args.reportedAt ?? existingIssue.issue.reportedAt) : existingIssue.issue.reportedAt;
  const resolution =
    !onHold && args.resolution
      ? {
          resolvedBy: user.isAdmin ? args.resolution.resolvedBy : (existingIssue.resolution?.resolvedBy ?? user.email),
          resolvedAt: user.isAdmin ? args.resolution.resolvedAt : (existingIssue.resolution?.resolvedAt ?? now),
          comment: args.resolution.comment,
          findings: existingIssue.resolution?.findings,
        }
      : undefined;
  const issue: Doc<"issues"> = {
    ...existingIssue,
    issue: {
      ...existingIssue.issue,
      description: args.description,
      urgent: args.urgent ?? false,
      supervisorNeeded: args.supervisorNeeded ?? false,
      cruzfixId: args.cruzfixId,
      sodId: args.sodId,
      onHold,
      reportedBy,
      reportedAt,
    },
    edited: { editedBy: user.email, editDate: now },
    resolution,
    feedStatus: resolution ? "RESOLVED" : "UNRESOLVED",
    feedDate: resolution?.resolvedAt ?? reportedAt,
  };

  updateIssueCaches(localStore, issue, existingIssue, user.roomGroupKey);
}
