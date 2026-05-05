import type { classroomSchemaPayload, issueMutationResult, issueSchema, taskMutationResult, taskSchema } from "@redwood/contracts";
import type { InfiniteData, QueryClient, QueryKey } from "@tanstack/react-query";
import type { z } from "zod";
import { webClientORPC } from "../lib/orpc-web-client";

type ClassroomPayload = z.infer<typeof classroomSchemaPayload>;
type Issue = z.infer<typeof issueSchema>;
type Task = z.infer<typeof taskSchema>;
type IssueMutationResult = z.infer<typeof issueMutationResult>;
type TaskMutationResult = z.infer<typeof taskMutationResult>;

type CacheMutationOperation = "upsert" | "delete";
type IssuePage = { issues: Issue[]; nextCursor?: string };
type TaskPage = { tasks: Task[]; nextCursor?: string };
const ISSUE_HISTORY_QUERY_KEY = [["issues", "getIssues"], { type: "infinite" }] as const satisfies QueryKey;
const TASK_HISTORY_QUERY_KEY = [["tasks", "getTasks"], { type: "infinite" }] as const satisfies QueryKey;

export function applyIssueMutationResult(queryClient: QueryClient, mutationResult: IssueMutationResult, operation: CacheMutationOperation) {
  applyRoomSnapshot(queryClient, mutationResult.roomSnapshot);
  applyActiveIssueMutation(queryClient, mutationResult.mutatedIssue, operation);
  applyIssueHistoryMutation(queryClient, mutationResult.mutatedIssue, operation);
}

export function applyRoomSnapshot(queryClient: QueryClient, room: ClassroomPayload) {
  queryClient.setQueryData(
    webClientORPC.classrooms.getRoom.queryOptions({
      input: { id: room._id },
    }).queryKey,
    room
  );

  queryClient.setQueryData(webClientORPC.classrooms.getRooms.queryOptions().queryKey, (rooms: ClassroomPayload[] | undefined) =>
    rooms?.map((existing) => (existing._id === room._id ? room : existing))
  );
}

function applyActiveIssueMutation(queryClient: QueryClient, issue: Issue, operation: CacheMutationOperation) {
  const updateActiveIssues = (issues: Issue[] | undefined) => {
    if (!issues) return issues;

    if (operation === "delete" || issue.resolution) return issues.filter((existing) => existing._id !== issue._id);

    return upsertSortedByReportedAt(issues, issue);
  };

  queryClient.setQueryData(webClientORPC.issues.getActiveIssues.queryOptions().queryKey, updateActiveIssues);
  queryClient.setQueryData(
    webClientORPC.issues.getActiveIssues.queryOptions({ input: { classroomId: issue.classroomId } }).queryKey,
    updateActiveIssues
  );
}

function applyIssueHistoryMutation(queryClient: QueryClient, issue: Issue, operation: CacheMutationOperation) {
  queryClient.setQueriesData<InfiniteData<IssuePage>>({ queryKey: ISSUE_HISTORY_QUERY_KEY }, (data) => {
    if (!data) return data;

    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        issues:
          operation === "delete"
            ? page.issues.filter((existing) => existing._id !== issue._id)
            : page.issues.map((existing) => (existing._id === issue._id ? issue : existing)),
      })),
    };
  });
}

function upsertSortedByReportedAt(issues: Issue[], issue: Issue) {
  return upsertById(issues, issue).sort(
    (a, b) => Number(b.issue.urgent) - Number(a.issue.urgent) || b.issue.reportedAt.getTime() - a.issue.reportedAt.getTime()
  );
}

export function applyTaskMutationResult(queryClient: QueryClient, mutationResult: TaskMutationResult, operation: CacheMutationOperation) {
  applyRoomSnapshot(queryClient, mutationResult.roomSnapshot);
  applyOpenTaskMutation(queryClient, mutationResult.mutatedTask, operation);
  applyTaskHistoryMutation(queryClient, mutationResult.mutatedTask, operation);
}

function applyOpenTaskMutation(queryClient: QueryClient, task: Task, operation: CacheMutationOperation) {
  const updateOpenTasks = (tasks: Task[] | undefined) => {
    if (!tasks) return tasks;

    if (operation === "delete" || task.completion || isFutureVisibleTask(task)) {
      return tasks.filter((existing) => existing._id !== task._id);
    }

    return upsertSortedByCreatedAt(tasks, task);
  };

  queryClient.setQueryData(webClientORPC.tasks.getOpenTasks.queryOptions().queryKey, updateOpenTasks);
  queryClient.setQueryData(
    webClientORPC.tasks.getOpenTasks.queryOptions({ input: { classroomId: task.classroomId } }).queryKey,
    updateOpenTasks
  );
}

function applyTaskHistoryMutation(queryClient: QueryClient, task: Task, operation: CacheMutationOperation) {
  queryClient.setQueriesData<InfiniteData<TaskPage>>({ queryKey: TASK_HISTORY_QUERY_KEY }, (data) => {
    if (!data) return data;

    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        tasks:
          operation === "delete"
            ? page.tasks.filter((existing) => existing._id !== task._id)
            : page.tasks.map((existing) => (existing._id === task._id ? task : existing)),
      })),
    };
  });
}

function upsertSortedByCreatedAt(tasks: Task[], task: Task) {
  return upsertById(tasks, task).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function isFutureVisibleTask(task: Task) {
  return !!task.task.visibleAt && task.task.visibleAt.getTime() > Date.now();
}

function upsertById<T extends { _id: string }>(items: T[], item: T) {
  const exists = items.some((existing) => existing._id === item._id);
  if (exists) return items.map((existing) => (existing._id === item._id ? item : existing));
  return [item, ...items];
}
