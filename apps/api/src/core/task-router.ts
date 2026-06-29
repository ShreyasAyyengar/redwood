import { classroomSchemaPayload, type taskFeedFilterSchema, taskSchema, taskTemplateSchema } from "@redwood/contracts";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { ClassroomService } from "../database/classroom-service";
import { TaskService } from "../database/task-service";
import { TaskTemplateService } from "../database/task-template-service";
import { adminProcedure, protectedProcedure } from "../libs/orpc-procedures";

const PAGE_SIZE = 5;
const NEWEST_FIRST = -1 as const;

type Task = z.infer<typeof taskSchema>;
type TaskFeedFilter = z.infer<typeof taskFeedFilterSchema>;
type TaskFeedQuery = {
  baseQuery: Record<string, unknown>;
  onlyCompleted: boolean;
  onlyOpen: boolean;
};

const getAfterDateCursorQuery = (datePath: string, date: Date, id: string, cursorOperator: "$lt" | "$gt") => ({
  $or: [
    { [datePath]: { [cursorOperator]: date } },
    {
      [datePath]: date,
      _id: { [cursorOperator]: id },
    },
  ],
});

function andQuery(...queries: Record<string, unknown>[]): Record<string, unknown> {
  const activeQueries = queries.filter((query) => Object.keys(query).length > 0);
  if (activeQueries.length === 0) return {};
  if (activeQueries.length === 1) return activeQueries[0] ?? {};
  return { $and: activeQueries };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getDateRangeQuery(range: { from?: Date; to?: Date } | undefined) {
  if (!(range?.from || range?.to)) return;

  const query: Record<string, Date> = {};
  if (range.from) query.$gte = range.from;
  if (range.to) {
    const end = new Date(range.to);
    end.setDate(end.getDate() + 1);
    query.$lt = end;
  }

  return query;
}

async function getTaskFeedQuery(filter: TaskFeedFilter | undefined): Promise<TaskFeedQuery> {
  const scopeQuery: Record<string, unknown> = {};

  if (filter?.classroomId) {
    scopeQuery.classroomId = filter.classroomId;
  } else if (filter?.group) {
    const classroomIds = await ClassroomService.distinct("_id", { groupKey: filter.group });
    scopeQuery.classroomId = { $in: classroomIds };
  }

  const search = filter?.search?.trim();
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    scopeQuery.$or = [{ "task.description": regex }, { "completion.comment": regex }];
  }

  const createdRangeQuery = getDateRangeQuery(filter?.created);
  if (createdRangeQuery) scopeQuery["task.createdAt"] = createdRangeQuery;

  const completedRangeQuery = getDateRangeQuery(filter?.completed);
  if (completedRangeQuery) scopeQuery["completion.completedAt"] = completedRangeQuery;

  if (filter?.urgent) scopeQuery["task.urgent"] = true;
  if (filter?.supervisorNeeded) scopeQuery["task.supervisorNeeded"] = true;
  if (filter?.hasDueDate) scopeQuery["task.completeBy"] = { $exists: true };

  return {
    baseQuery: scopeQuery,
    onlyCompleted: filter?.status === "COMPLETED" || Boolean(completedRangeQuery),
    onlyOpen: filter?.status === "OPEN",
  };
}

async function getTaskCursor(cursor: string | undefined, query: TaskFeedQuery) {
  if (!cursor) return;

  const task = await TaskService.findOne({
    _id: cursor,
    ...query.baseQuery,
  }).lean();

  return (task as Task | null) ?? undefined;
}

function getTaskStatusQuery(query: TaskFeedQuery) {
  if (query.onlyCompleted) return { completion: { $exists: true } };
  if (query.onlyOpen) return { completion: { $exists: false } };
  return {};
}

async function getOldestTaskPage(query: TaskFeedQuery, cursorTask: Task | undefined) {
  const getAfterCursorQuery = (task: Task) => getAfterDateCursorQuery("task.createdAt", task.task.createdAt, task._id, "$gt");
  const taskQuery = andQuery(query.baseQuery, getTaskStatusQuery(query), cursorTask ? getAfterCursorQuery(cursorTask) : {});
  const tasks = await TaskService.find(taskQuery).lean().sort({ "task.createdAt": 1, _id: 1 }).limit(PAGE_SIZE);
  const lastTask = tasks.at(-1);
  const hasMore = lastTask
    ? await TaskService.exists(andQuery(query.baseQuery, getTaskStatusQuery(query), getAfterCursorQuery(lastTask)))
    : false;

  return {
    tasks,
    nextCursor: hasMore && lastTask ? lastTask._id : undefined,
  };
}

async function getNewestTaskFeedPage(query: TaskFeedQuery, cursorTask: Task | undefined) {
  const tasks: Task[] = [];

  if (!(query.onlyCompleted || cursorTask?.completion)) {
    const openCursorQuery = cursorTask ? getAfterDateCursorQuery("task.createdAt", cursorTask.task.createdAt, cursorTask._id, "$lt") : {};
    const openTasks = (await TaskService.find(andQuery(query.baseQuery, { completion: { $exists: false } }, openCursorQuery))
      .lean()
      .sort({ "task.createdAt": NEWEST_FIRST, _id: NEWEST_FIRST })
      .limit(PAGE_SIZE)) as Task[];

    tasks.push(...openTasks);
  }

  if (tasks.length < PAGE_SIZE && !query.onlyOpen) {
    const completedCursorQuery = cursorTask?.completion
      ? getAfterDateCursorQuery("completion.completedAt", cursorTask.completion.completedAt, cursorTask._id, "$lt")
      : {};
    const completedTasks = (await TaskService.find(andQuery(query.baseQuery, { completion: { $exists: true } }, completedCursorQuery))
      .lean()
      .sort({ "completion.completedAt": NEWEST_FIRST, _id: NEWEST_FIRST })
      .limit(PAGE_SIZE - tasks.length)) as Task[];

    tasks.push(...completedTasks);
  }

  const lastTask = tasks.at(-1);
  const hasMore = lastTask ? await hasMoreNewestTasksAfter(query, lastTask) : false;

  return {
    tasks,
    nextCursor: hasMore && lastTask ? lastTask._id : undefined,
  };
}

async function hasMoreNewestTasksAfter(query: TaskFeedQuery, task: Task) {
  if (task.completion) {
    return Boolean(
      await TaskService.exists(
        andQuery(
          query.baseQuery,
          { completion: { $exists: true } },
          getAfterDateCursorQuery("completion.completedAt", task.completion.completedAt, task._id, "$lt")
        )
      )
    );
  }

  const hasMoreOpenTasks = await TaskService.exists(
    andQuery(
      query.baseQuery,
      { completion: { $exists: false } },
      getAfterDateCursorQuery("task.createdAt", task.task.createdAt, task._id, "$lt")
    )
  );
  const hasCompletedTasks = !query.onlyOpen && (await TaskService.exists(andQuery(query.baseQuery, { completion: { $exists: true } })));

  return Boolean(hasMoreOpenTasks || hasCompletedTasks);
}

export const taskRouter = {
  getTasks: protectedProcedure.tasks.getTasks.handler(async ({ input, errors }) => {
    const query = await getTaskFeedQuery(input.filter);
    const cursorTask = await getTaskCursor(input.cursor, query);

    if (query.onlyOpen && query.onlyCompleted) {
      return { tasks: [], nextCursor: undefined };
    }

    if (input.cursor && !cursorTask) {
      throw errors.NOT_FOUND({
        data: { message: `Task cursor ${input.cursor} not found` },
      });
    }

    return input.direction === "OLDEST_FIRST" ? getOldestTaskPage(query, cursorTask) : getNewestTaskFeedPage(query, cursorTask);
  }),

  getOpenTasks: protectedProcedure.tasks.getOpenTasks.handler(({ input }) => {
    if (input?.classroomId) {
      return TaskService.find({ completion: { $exists: false }, classroomId: input.classroomId })
        .lean()
        .sort({ "task.createdAt": -1, _id: -1 });
    }
    return TaskService.find({ completion: { $exists: false } })
      .lean()
      .sort({ "task.createdAt": -1, _id: -1 });
  }),

  addTask: protectedProcedure.tasks.addTask.handler(async ({ input, errors, context }) => {
    const classroom = await ClassroomService.findById(input.classroomId).lean();
    if (!classroom) throw errors.NOT_FOUND({ data: { message: `Classroom with id ${input.classroomId} not found` } });

    if (!classroom.isActive) throw errors.UNPROCESSABLE_CONTENT({ data: { message: `Classroom ${input.classroomId} is not active.` } });

    const newTask: z.infer<typeof taskSchema> = {
      _id: uuidv7(),
      classroomId: input.classroomId,
      createdBy: input.createdBy || context.user.email,
      createdAt: new Date(),
      task: {
        description: input.description,
        urgent: input.urgent,
        supervisorNeeded: input.supervisorNeeded,
        visibleAt: input.visibleAt,
        completeBy: input.completeBy,
        createdBy: input.createdBy || context.user.email,
        createdAt: new Date(),
      },
    };

    const isValid = taskSchema.safeParse(newTask);
    if (!isValid.success) throw errors.INTERNAL_SERVER_ERROR({ data: { message: isValid.error.message } });

    try {
      await TaskService.insertOne(newTask);
      return {
        mutatedTask: newTask,
        roomSnapshot: await getRoomSnapshot(newTask.classroomId),
      };
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),

  bulkAddTasks: adminProcedure.tasks.bulkAddTasks.handler(async ({ input, errors, context }) => {
    const targetClassrooms = await findBulkTargetClassrooms({
      attributeIds: input.attributeIds,
      classroomIds: input.classroomIds,
      onlyActive: true,
    });

    if (targetClassrooms.length === 0) {
      throw errors.UNPROCESSABLE_CONTENT({ data: { message: "Select at least one active classroom for bulk task creation." } });
    }

    const now = new Date();
    const createdBy = input.createdBy || context.user.email;
    const newTasks: z.infer<typeof taskSchema>[] = targetClassrooms.map((classroom) => ({
      _id: uuidv7(),
      classroomId: classroom._id,
      createdBy,
      createdAt: now,
      task: {
        description: input.description,
        urgent: input.urgent,
        supervisorNeeded: input.supervisorNeeded,
        visibleAt: input.visibleAt,
        completeBy: input.completeBy,
        createdBy,
        createdAt: now,
      },
    }));

    const isValid = taskSchema.array().safeParse(newTasks);
    if (!isValid.success) throw errors.INTERNAL_SERVER_ERROR({ data: { message: isValid.error.message } });

    try {
      await TaskService.insertMany(newTasks);
      return {
        mutatedTasks: newTasks,
        roomSnapshots: await Promise.all(newTasks.map((task) => getRoomSnapshot(task.classroomId))),
      };
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),

  editTask: protectedProcedure.tasks.editTask.handler(async ({ input, errors, context }) => {
    const task = await TaskService.findById(input._id).lean();
    if (!task) throw errors.NOT_FOUND({ data: { message: `Task with id ${input._id} not found` } });
    const isAdmin = context.user.role === "admin";

    // Conditionally allowed for admins
    const newCreatedBy = isAdmin ? (input.createdBy ?? task.task.createdBy) : task.task.createdBy;
    const newCreatedAt = isAdmin ? (input.createdAt ?? task.task.createdAt) : task.task.createdAt;

    // Check if non-completion fields were changed
    const nonCompletionChanged =
      input.description !== task.task.description ||
      input.urgent !== task.task.urgent ||
      input.supervisorNeeded !== task.task.supervisorNeeded ||
      input.visibleAt?.getTime() !== task.task.visibleAt?.getTime() ||
      input.completeBy?.getTime() !== task.task.completeBy?.getTime() ||
      newCreatedBy !== task.task.createdBy ||
      newCreatedAt.getTime() !== task.task.createdAt.getTime();

    const updatedTask: z.infer<typeof taskSchema> = {
      ...task,
      task: {
        ...task.task,
        description: input.description,
        urgent: input.urgent,
        supervisorNeeded: input.supervisorNeeded,
        visibleAt: input.visibleAt,
        completeBy: input.completeBy,
        createdBy: newCreatedBy,
        createdAt: newCreatedAt,
      },

      // if the completion existed and was changed, mark as edited
      // if any other field was changed, mark as edited
      ...((nonCompletionChanged || (task.completion && input.completion !== task.completion)) && {
        edited: {
          editedBy: context.user.email,
          editDate: new Date(),
        },
      }),
      ...(input.completion
        ? {
            completion: {
              // the completedBy can be different than the context, only if user is admin
              completedBy: isAdmin ? input.completion.completedBy : context.user.email,
              completedAt: isAdmin ? input.completion.completedAt : new Date(),
              comment: input.completion.comment,
            },
          }
        : undefined),
    };

    const isValid = taskSchema.safeParse(updatedTask);
    if (!isValid.success) throw errors.INTERNAL_SERVER_ERROR({ data: { message: isValid.error.message } });

    try {
      await TaskService.replaceOne({ _id: input._id }, updatedTask).lean();
      return {
        mutatedTask: updatedTask,
        roomSnapshot: await getRoomSnapshot(updatedTask.classroomId),
      };
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),

  deleteTask: protectedProcedure.tasks.deleteTask.handler(async ({ input, errors }) => {
    const task = await TaskService.findById(input.taskId).lean();
    if (!task) throw errors.NOT_FOUND({ data: { message: `Task with id ${input.taskId} not found` } });

    try {
      await TaskService.findByIdAndDelete(input.taskId).lean();
      return {
        mutatedTask: task,
        roomSnapshot: await getRoomSnapshot(task.classroomId),
      };
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),

  addTaskTemplate: adminProcedure.tasks.addTaskTemplate.handler(async ({ input, errors }) => {
    const existingTemplate = await TaskTemplateService.findOne({ name: input.name }).lean();
    if (existingTemplate) {
      throw errors.UNPROCESSABLE_CONTENT({ data: { message: "Task template with this name already exists." } });
    }

    const newTemplate: z.infer<typeof taskTemplateSchema> = {
      ...input,
      _id: uuidv7(),
    };

    const isValid = taskTemplateSchema.safeParse(newTemplate);
    if (!isValid.success) throw errors.INTERNAL_SERVER_ERROR({ data: { message: isValid.error.message } });

    try {
      await TaskTemplateService.create(newTemplate);
      return newTemplate;
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),

  getTaskTemplates: adminProcedure.tasks.getTaskTemplates.handler(async ({ errors }) => {
    try {
      return await TaskTemplateService.find().lean().sort({ createdAt: -1 });
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),
};

function findBulkTargetClassrooms({
  attributeIds,
  classroomIds,
  onlyActive,
}: {
  attributeIds: string[];
  classroomIds: string[];
  onlyActive: boolean;
}) {
  const targetFilters: Record<string, unknown>[] = [];
  if (classroomIds.length > 0) targetFilters.push({ _id: { $in: classroomIds } });
  if (attributeIds.length > 0) targetFilters.push({ attributes: { $in: attributeIds } });

  return ClassroomService.find({
    ...(onlyActive ? { isActive: true } : {}),
    ...(targetFilters.length > 0 ? { $or: targetFilters } : {}),
  }).lean();
}

async function getRoomSnapshot(classroomId: string): Promise<z.infer<typeof classroomSchemaPayload>> {
  const room = await ClassroomService.aggregate([
    { $match: { _id: classroomId } },
    {
      $lookup: {
        from: "issues",
        let: { roomId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$classroomId", "$$roomId"] },
              resolution: { $exists: false },
            },
          },
          { $count: "count" },
        ],
        as: "activeIssueCountResult",
      },
    },
    {
      $lookup: {
        from: "tasks",
        let: { roomId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$classroomId", "$$roomId"] },
              completion: { $exists: false },
              $or: [{ visibleAt: { $exists: false } }, { visibleAt: { $lte: new Date() } }],
            },
          },
          { $count: "count" },
        ],
        as: "taskCountResult",
      },
    },
    {
      $addFields: {
        activeIssuesCount: {
          $ifNull: [{ $arrayElemAt: ["$activeIssueCountResult.count", 0] }, 0],
        },
        openTasksCount: {
          $ifNull: [{ $arrayElemAt: ["$taskCountResult.count", 0] }, 0],
        },
      },
    },
    { $project: { activeIssueCountResult: 0, taskCountResult: 0 } },
  ]).then((results) => results[0]);

  return classroomSchemaPayload.parse(room);
}
