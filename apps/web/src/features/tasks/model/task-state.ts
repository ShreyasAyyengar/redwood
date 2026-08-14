import type { Doc } from "@backend/convex/_generated/dataModel";

export type Task = Doc<"tasks">;

export function isTaskVisible(task: Task, now = Date.now()) {
  return !task.task.visibleAt || Date.parse(task.task.visibleAt) <= now;
}

export function isOpenTask(task: Task, now = Date.now()) {
  return !task.completion && isTaskVisible(task, now);
}

export function isScheduledTask(task: Task, now = Date.now()) {
  return !task.completion && Boolean(task.task.visibleAt && Date.parse(task.task.visibleAt) > now);
}

export function isOverdueTask(task: Task, now = Date.now()) {
  return !task.completion && Boolean(task.task.completeBy && Date.parse(task.task.completeBy) < now);
}

export function sortOpenTasks(tasks: Task[]) {
  return [...tasks].sort((left, right) => {
    if (left.task.urgent !== right.task.urgent) return left.task.urgent ? -1 : 1;
    return Date.parse(right.task.createdAt) - Date.parse(left.task.createdAt);
  });
}
