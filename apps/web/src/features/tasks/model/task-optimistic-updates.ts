import { api } from "@backend/convex/_generated/api";
import type { Doc, Id } from "@backend/convex/_generated/dataModel";
import type { OptimisticLocalStore } from "convex/browser";
import type { FunctionArgs } from "convex/server";

type AddTaskArgs = FunctionArgs<typeof api.core.tasks.service.addTask>;
type EditTaskArgs = FunctionArgs<typeof api.core.tasks.service.editTask>;
type TaskFeedQueryArgs = Omit<FunctionArgs<typeof api.core.tasks.service.getTasks>, "paginationOpts">;

type OptimisticTaskUser = {
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

function matchesScope(task: Doc<"tasks">, filters: NonNullable<TaskFeedQueryArgs["filters"]>, roomGroupKey: string | undefined) {
  if (filters.classroomId) return task.classroomId === filters.classroomId;
  return !filters.group || filters.group === roomGroupKey;
}

function matchesState(task: Doc<"tasks">, filters: NonNullable<TaskFeedQueryArgs["filters"]>) {
  const isCompleted = task.completion !== undefined;
  if (filters.status && isCompleted !== (filters.status === "COMPLETED")) return false;
  return isInDateRange(task.task.createdAt, filters.created) && isInDateRange(task.completion?.completedAt, filters.completed);
}

function matchesFlags(task: Doc<"tasks">, filters: NonNullable<TaskFeedQueryArgs["filters"]>) {
  if (filters.urgent && !task.task.urgent) return false;
  if (filters.supervisorNeeded && !task.task.supervisorNeeded) return false;
  return !(filters.hasDueDate && !task.task.completeBy);
}

function matchesSearch(task: Doc<"tasks">, filters: NonNullable<TaskFeedQueryArgs["filters"]>) {
  const search = filters.search?.trim().toLocaleLowerCase();
  if (!search) return true;
  return task.task.description.toLocaleLowerCase().includes(search) || (task.completion?.comment?.toLocaleLowerCase().includes(search) ?? false);
}

function taskMatchesFeed(task: Doc<"tasks">, { filters, view }: TaskFeedQueryArgs, roomGroupKey: string | undefined) {
  if (view === "OPEN" && task.completion) return false;
  if (!filters) return true;
  return matchesScope(task, filters, roomGroupKey) && matchesState(task, filters) && matchesFlags(task, filters) && matchesSearch(task, filters);
}

function updateClassroomTasks(localStore: OptimisticLocalStore, task: Doc<"tasks">, previousTask: Doc<"tasks"> | undefined) {
  const queryArgs = { classroomId: task.classroomId };
  const tasks = localStore.getQuery(api.core.tasks.service.getClassroomTasks, queryArgs);
  if (!tasks) return;

  const nextTasks = previousTask ? tasks.map((item) => (item._id === task._id ? task : item)) : [task, ...tasks];
  localStore.setQuery(api.core.tasks.service.getClassroomTasks, queryArgs, nextTasks);
  return nextTasks;
}

function updateOpenTaskQueries(localStore: OptimisticLocalStore, task: Doc<"tasks">, previousTask: Doc<"tasks"> | undefined) {
  for (const query of localStore.getAllQueries(api.core.tasks.service.getOpenTasks)) {
    if (!query.value || (query.args.classroomId && query.args.classroomId !== task.classroomId)) continue;

    const wasOpen = previousTask ? !previousTask.completion : false;
    const withoutTask = query.value.filter((item) => item._id !== task._id);
    if (!task.completion) {
      const nextTasks = wasOpen ? query.value.map((item) => (item._id === task._id ? task : item)) : [task, ...withoutTask];
      localStore.setQuery(api.core.tasks.service.getOpenTasks, query.args, nextTasks);
    } else if (wasOpen) {
      localStore.setQuery(api.core.tasks.service.getOpenTasks, query.args, withoutTask);
    }
  }
}

function updateTaskFeedQueries(
  localStore: OptimisticLocalStore,
  task: Doc<"tasks">,
  previousTask: Doc<"tasks"> | undefined,
  roomGroupKey: string | undefined
) {
  for (const query of localStore.getAllQueries(api.core.tasks.service.getTasks)) {
    if (!query.value) continue;

    const queryArgs: TaskFeedQueryArgs = query.args.filters ? { view: query.args.view, filters: query.args.filters } : { view: query.args.view };
    const didMatch = previousTask ? taskMatchesFeed(previousTask, queryArgs, roomGroupKey) : false;
    const doesMatch = taskMatchesFeed(task, queryArgs, roomGroupKey);
    const containsTask = query.value.page.some((item) => item._id === task._id);

    if (containsTask) {
      localStore.setQuery(api.core.tasks.service.getTasks, query.args, {
        ...query.value,
        page: doesMatch
          ? query.value.page.map((item) => (item._id === task._id ? task : item))
          : query.value.page.filter((item) => item._id !== task._id),
      });
    } else if (!didMatch && doesMatch && query.args.paginationOpts.cursor === null) {
      localStore.setQuery(api.core.tasks.service.getTasks, query.args, { ...query.value, page: [task, ...query.value.page] });
    }
  }
}

function updateTaskRoomSummaries(localStore: OptimisticLocalStore, classroomId: Id<"classrooms">, tasks: Doc<"tasks">[]) {
  const now = Date.now();
  const openTasksCount = tasks.filter((item) => !item.completion && (!item.task.visibleAt || Date.parse(item.task.visibleAt) <= now)).length;
  const room = localStore.getQuery(api.core.classrooms.service.getRoom, { id: classroomId });
  if (room) localStore.setQuery(api.core.classrooms.service.getRoom, { id: classroomId }, { ...room, openTasksCount });

  const rooms = localStore.getQuery(api.core.classrooms.service.getAllRooms, {});
  if (!rooms) return;
  localStore.setQuery(
    api.core.classrooms.service.getAllRooms,
    {},
    rooms.map((item) => (item._id === classroomId ? { ...item, openTasksCount } : item))
  );
}

function updateTaskCaches(localStore: OptimisticLocalStore, task: Doc<"tasks">, previousTask: Doc<"tasks"> | undefined, roomGroupKey?: string) {
  const classroomTasks = updateClassroomTasks(localStore, task, previousTask);
  updateOpenTaskQueries(localStore, task, previousTask);
  updateTaskFeedQueries(localStore, task, previousTask, roomGroupKey);
  if (classroomTasks) updateTaskRoomSummaries(localStore, task.classroomId, classroomTasks);
}

export function optimisticallyCreateTask(localStore: OptimisticLocalStore, args: AddTaskArgs, user: OptimisticTaskUser) {
  const now = new Date().toISOString();
  const createdBy = user.isAdmin ? (args.createdBy ?? user.email) : user.email;
  const createdAt = user.isAdmin ? (args.createdAt ?? now) : now;
  const task: Doc<"tasks"> = {
    _id: crypto.randomUUID() as Id<"tasks">,
    _creationTime: Date.now(),
    classroomId: args.classroomId as Id<"classrooms">,
    createdBy,
    createdAt,
    task: {
      description: args.description,
      urgent: args.urgent,
      supervisorNeeded: args.supervisorNeeded,
      visibleAt: args.visibleAt,
      completeBy: args.completeBy,
      createdBy,
      createdAt,
    },
    feedStatus: "OPEN",
    feedDate: createdAt,
  };

  updateTaskCaches(localStore, task, undefined, user.roomGroupKey);
}

export function optimisticallyEditTask(
  localStore: OptimisticLocalStore,
  args: EditTaskArgs,
  existingTask: Doc<"tasks">,
  user: OptimisticTaskUser
) {
  const now = new Date().toISOString();
  const createdBy = user.isAdmin ? (args.createdBy ?? existingTask.task.createdBy) : existingTask.task.createdBy;
  const createdAt = user.isAdmin ? (args.createdAt ?? existingTask.task.createdAt) : existingTask.task.createdAt;
  const completion = args.completion
    ? {
        completedBy: user.isAdmin ? args.completion.completedBy : (existingTask.completion?.completedBy ?? user.email),
        completedAt: user.isAdmin ? args.completion.completedAt : (existingTask.completion?.completedAt ?? now),
        comment: args.completion.comment,
      }
    : undefined;
  const task: Doc<"tasks"> = {
    ...existingTask,
    task: {
      description: args.description,
      urgent: args.urgent,
      supervisorNeeded: args.supervisorNeeded,
      visibleAt: args.visibleAt,
      completeBy: args.completeBy,
      createdBy,
      createdAt,
    },
    edited: { editedBy: user.email, editDate: now },
    completion,
    feedStatus: completion ? "COMPLETED" : "OPEN",
    feedDate: completion?.completedAt ?? createdAt,
  };

  updateTaskCaches(localStore, task, existingTask, user.roomGroupKey);
}
