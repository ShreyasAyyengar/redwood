import { paginationOptsValidator } from "convex/server";
import { ConvexError } from "convex/values";
import { stream } from "convex-helpers/server/stream";
import { convexToZod, withSystemFields, zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import { authComponent } from "../../auth.ts";
import { adminMutation, protectedMutation, protectedQuery, supervisorMutation, supervisorQuery } from "../../lib/procedures.ts";
import schema from "../../schema.ts";
import {
  bulkTaskFormSchema,
  type taskFeedDateRangeFilterSchema,
  taskFeedFilterSchema,
  taskSchema,
  taskTemplateSchema,
  uiTaskFormSchema,
} from "./schemas.ts";

export const taskDoc = z.object(withSystemFields("tasks", taskSchema.shape));
export const taskTemplateDoc = z.object(withSystemFields("taskTemplates", taskTemplateSchema.shape));

type Task = z.infer<typeof taskSchema>;
type TaskFeedFilter = z.infer<typeof taskFeedFilterSchema>;
type TaskFeedDateRangeFilter = z.infer<typeof taskFeedDateRangeFilterSchema>;

function isInDateRange(value: string | undefined, range: TaskFeedDateRangeFilter | undefined) {
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

function matchesScope(task: Task, filters: TaskFeedFilter, groupClassroomIds: Set<string> | undefined) {
  if (filters.classroomId) return task.classroomId === filters.classroomId;
  return !groupClassroomIds || groupClassroomIds.has(task.classroomId);
}

function matchesState(task: Task, filters: TaskFeedFilter) {
  const isCompleted = task.completion !== undefined;

  if (filters.status && isCompleted !== (filters.status === "COMPLETED")) return false;
  if (!isInDateRange(task.task.createdAt, filters.created)) return false;
  if (!isInDateRange(task.completion?.completedAt, filters.completed)) return false;

  return true;
}

function matchesFlags(task: Task, filters: TaskFeedFilter) {
  if (filters.urgent && !task.task.urgent) return false;
  if (filters.supervisorNeeded && !task.task.supervisorNeeded) return false;
  if (filters.hasDueDate && !task.task.completeBy) return false;

  return true;
}

function matchesSearch(task: Task, filters: TaskFeedFilter) {
  const search = filters.search?.trim().toLocaleLowerCase();
  if (!search) return true;

  const descriptionMatches = task.task.description.toLocaleLowerCase().includes(search);
  const completionMatches = task.completion?.comment?.toLocaleLowerCase().includes(search) ?? false;
  return descriptionMatches || completionMatches;
}

function matchesTask(task: Task, filters: TaskFeedFilter | undefined, groupClassroomIds: Set<string> | undefined) {
  if (!filters) return true;

  return (
    matchesScope(task, filters, groupClassroomIds) && matchesState(task, filters) && matchesFlags(task, filters) && matchesSearch(task, filters)
  );
}

function dateValuesMatch(left: string | undefined, right: string | undefined) {
  if (!(left || right)) return true;
  if (!(left && right)) return false;
  return Date.parse(left) === Date.parse(right);
}

function completionValuesMatch(left: Task["completion"], right: Task["completion"]) {
  if (!(left || right)) return true;
  if (!(left && right)) return false;

  return left.completedBy === right.completedBy && left.comment === right.comment && dateValuesMatch(left.completedAt, right.completedAt);
}

export const getTasks = protectedQuery({
  args: z.object({
    view: z.enum(["OPEN", "ALL"]),
    filters: taskFeedFilterSchema.optional(),
    paginationOpts: convexToZod(paginationOptsValidator),
  }),

  handler: async (ctx, args) => {
    const { filters, view } = args;
    const classroomId = filters?.classroomId;

    let groupClassroomIds: Set<string> | undefined;
    if (filters?.group && !classroomId) {
      const { group } = filters;
      const classrooms = await ctx.db
        .query("classrooms")
        .withIndex("byGroupKey", (query) => query.eq("groupKey", group))
        .collect();
      groupClassroomIds = new Set(classrooms.map((classroom) => classroom._id));
    }

    const inferredStatus = filters?.status ?? (filters?.completed ? "COMPLETED" : undefined);
    const indexedStatus = view === "OPEN" ? "OPEN" : inferredStatus;
    const tasks = stream(ctx.db, schema);

    const orderedTasks = classroomId
      ? indexedStatus
        ? tasks
            .query("tasks")
            .withIndex("byClassroomIdAndFeed", (query) => query.eq("classroomId", classroomId).eq("feedStatus", indexedStatus))
            .order("desc")
        : tasks
            .query("tasks")
            .withIndex("byClassroomIdAndFeed", (query) => query.eq("classroomId", classroomId))
            .order("desc")
      : indexedStatus
        ? tasks
            .query("tasks")
            .withIndex("byFeed", (query) => query.eq("feedStatus", indexedStatus))
            .order("desc")
        : tasks.query("tasks").withIndex("byFeed").order("desc");

    return orderedTasks
      .filterWith(async (task) => matchesTask(task, filters, groupClassroomIds))
      .paginate({
        ...args.paginationOpts,
      });
  },
});

export const getOpenTasks = protectedQuery({
  args: z.object({
    classroomId: zid("classrooms").optional(),
  }),
  returns: z.array(taskDoc),
  handler: (ctx, { classroomId }) => {
    if (classroomId) {
      return ctx.db
        .query("tasks")
        .withIndex("byClassroomIdAndFeed", (query) => query.eq("classroomId", classroomId).eq("feedStatus", "OPEN"))
        .order("desc")
        .collect();
    }

    return ctx.db
      .query("tasks")
      .withIndex("byFeed", (query) => query.eq("feedStatus", "OPEN"))
      .order("desc")
      .collect();
  },
});

// Returns the complete task history for one classroom. Consumers derive open,
// scheduled, overdue, and completed views from this reactive collection.
export const getClassroomTasks = protectedQuery({
  args: z.object({
    classroomId: zid("classrooms"),
  }),
  returns: z.array(taskDoc),
  handler: (ctx, { classroomId }) =>
    ctx.db
      .query("tasks")
      .withIndex("byClassroomIdAndFeed", (query) => query.eq("classroomId", classroomId))
      .order("desc")
      .collect(),
});

export const addTask = protectedMutation({
  args: uiTaskFormSchema.extend({ classroomId: zid("classrooms") }),
  handler: async (ctx, args) => {
    const classroom = await ctx.db.get("classrooms", args.classroomId);
    if (!classroom) throw new ConvexError({ code: "NOT_FOUND", message: `Classroom with id ${args.classroomId} not found` });
    if (!classroom.isActive) throw new ConvexError({ code: "UNPROCESSABLE_CONTENT", message: `Classroom ${args.classroomId} is not active.` });

    const user = await authComponent.getAuthUser(ctx);
    const now = new Date().toISOString();
    const isAdmin = user.role === "admin";
    const createdBy = isAdmin ? (args.createdBy ?? user.email) : user.email;
    const createdAt = isAdmin ? (args.createdAt ?? now) : now;
    const newTask: z.infer<typeof taskSchema> = {
      classroomId: args.classroomId,
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

    await ctx.db.insert("tasks", newTask);
  },
});

export const bulkAddTasks = supervisorMutation({
  args: bulkTaskFormSchema,
  handler: async (ctx, args) => {
    const selectedClassrooms = new Set(args.classroomIds);
    const selectedAttributes = new Set(args.attributeIds);
    const targetsAllActiveClassrooms = selectedClassrooms.size === 0 && selectedAttributes.size === 0;

    const classrooms = await ctx.db
      .query("classrooms")
      .withIndex("byIsActive", (query) => query.eq("isActive", true))
      .collect();
    const classroomIds = classrooms
      .filter(
        (classroom) =>
          targetsAllActiveClassrooms ||
          selectedClassrooms.has(classroom._id) ||
          classroom.attributes.some((attributeId) => selectedAttributes.has(attributeId))
      )
      .map((classroom) => classroom._id);

    if (classroomIds.length === 0) {
      throw new ConvexError({ code: "UNPROCESSABLE_CONTENT", message: "Select at least one active classroom for bulk task creation." });
    }

    const user = await authComponent.getAuthUser(ctx);
    const now = new Date().toISOString();
    const createdBy = user.role === "admin" ? (args.createdBy ?? user.email) : user.email;
    const newTasks: z.infer<typeof taskSchema>[] = classroomIds.map((classroomId) => ({
      classroomId,
      createdBy,
      createdAt: now,
      task: {
        description: args.description,
        urgent: args.urgent,
        supervisorNeeded: args.supervisorNeeded,
        visibleAt: args.visibleAt,
        completeBy: args.completeBy,
        createdBy,
        createdAt: now,
      },
      feedStatus: "OPEN",
      feedDate: now,
    }));

    await Promise.all(newTasks.map((task) => ctx.db.insert("tasks", task)));
  },
});

export const editTask = protectedMutation({
  args: uiTaskFormSchema.extend({ _id: zid("tasks") }),
  handler: async (ctx, args) => {
    const taskDocument = await ctx.db.get("tasks", args._id);
    if (!taskDocument) throw new ConvexError({ code: "NOT_FOUND", message: `Task with id ${args._id} not found` });

    const user = await authComponent.getAuthUser(ctx);
    const isAdmin = user.role === "admin";
    const now = new Date().toISOString();
    const newCreatedBy = isAdmin ? (args.createdBy ?? taskDocument.task.createdBy) : taskDocument.task.createdBy;
    const newCreatedAt = isAdmin ? (args.createdAt ?? taskDocument.task.createdAt) : taskDocument.task.createdAt;
    const newCompletion = args.completion
      ? {
          completedBy: isAdmin ? args.completion.completedBy : (taskDocument.completion?.completedBy ?? user.email),
          completedAt: isAdmin ? args.completion.completedAt : (taskDocument.completion?.completedAt ?? now),
          comment: args.completion.comment,
        }
      : undefined;

    const nonCompletionChanged =
      args.description !== taskDocument.task.description ||
      args.urgent !== taskDocument.task.urgent ||
      args.supervisorNeeded !== taskDocument.task.supervisorNeeded ||
      !dateValuesMatch(args.visibleAt, taskDocument.task.visibleAt) ||
      !dateValuesMatch(args.completeBy, taskDocument.task.completeBy) ||
      newCreatedBy !== taskDocument.task.createdBy ||
      !dateValuesMatch(newCreatedAt, taskDocument.task.createdAt);
    const completionChanged = !completionValuesMatch(newCompletion, taskDocument.completion);
    const edited =
      nonCompletionChanged || completionChanged
        ? {
            editedBy: user.email,
            editDate: now,
          }
        : taskDocument.edited;

    const updatedTask: z.infer<typeof taskSchema> = {
      classroomId: taskDocument.classroomId,
      createdBy: taskDocument.createdBy,
      createdAt: taskDocument.createdAt,
      task: {
        description: args.description,
        urgent: args.urgent,
        supervisorNeeded: args.supervisorNeeded,
        visibleAt: args.visibleAt,
        completeBy: args.completeBy,
        createdBy: newCreatedBy,
        createdAt: newCreatedAt,
      },
      edited,
      completion: newCompletion,
      feedStatus: newCompletion ? "COMPLETED" : "OPEN",
      feedDate: newCompletion?.completedAt ?? newCreatedAt,
    };

    await ctx.db.patch("tasks", args._id, updatedTask);
  },
});

export const deleteTask = protectedMutation({
  args: taskDoc.pick({ _id: true }),
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, args) => {
    const task = await ctx.db.get("tasks", args._id);
    if (!task) throw new ConvexError({ code: "NOT_FOUND", message: `Task with id ${args._id} not found` });

    await ctx.db.delete("tasks", args._id);
    return { success: true };
  },
});

export const getTaskTemplates = supervisorQuery({
  returns: z.array(taskTemplateDoc),
  handler: (ctx) => ctx.db.query("taskTemplates").order("desc").collect(),
});

export const addTaskTemplate = supervisorMutation({
  args: taskTemplateSchema,
  returns: taskTemplateDoc,
  handler: async (ctx, args) => {
    const existingTemplate = await ctx.db
      .query("taskTemplates")
      .withIndex("byName", (query) => query.eq("name", args.name))
      .first();
    if (existingTemplate) throw new ConvexError({ code: "UNPROCESSABLE_CONTENT", message: "Task template with this name already exists." });

    const templateId = await ctx.db.insert("taskTemplates", args);
    const template = await ctx.db.get("taskTemplates", templateId);
    if (!template) throw new ConvexError({ code: "INTERNAL_SERVER_ERROR", message: "Task template was not created." });

    return template;
  },
});

export const deleteTaskTemplate = adminMutation({
  args: taskTemplateDoc.pick({ _id: true }),
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, args) => {
    const template = await ctx.db.get("taskTemplates", args._id);
    if (!template) throw new ConvexError({ code: "NOT_FOUND", message: `Task template with id ${args._id} not found` });

    await ctx.db.delete("taskTemplates", args._id);
    return { success: true };
  },
});

export const editTaskTemplate = adminMutation({
  args: taskTemplateSchema.extend({ _id: zid("taskTemplates") }),
  handler: async (ctx, args) => {
    const template = await ctx.db.get("taskTemplates", args._id);
    if (!template) throw new ConvexError({ code: "NOT_FOUND", message: `Task template with id ${args._id} not found` });

    await ctx.db.patch("taskTemplates", args._id, args);
  },
});
