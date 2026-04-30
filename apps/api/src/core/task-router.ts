import { taskSchema } from "@redwood/contracts";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { ClassroomService } from "../database/classroom-service";
import { TaskService } from "../database/task-service";
import { protectedProcedure } from "../libs/orpc-procedures";

const PAGE_SIZE = 5;

export const taskRouter = {
  getTasks: protectedProcedure.tasks.getTasks.handler(async ({ input, errors }) => {
    const { filter, direction, cursor } = input;
    const scopeQuery: Record<string, unknown> = {};

    if (filter?.classroomId) {
      scopeQuery.classroomId = filter.classroomId;
    } else if (filter?.group) {
      const classroomIds = await ClassroomService.distinct("_id", { groupKey: filter.group });
      scopeQuery.classroomId = { $in: classroomIds };
    }

    const sortDirection = direction === "NEWEST_FIRST" ? -1 : 1;
    const cursorOperator = direction === "NEWEST_FIRST" ? "$lt" : "$gt";

    const getAfterCursorQuery = (task: z.infer<typeof taskSchema>) => ({
      $or: [
        { createdAt: { [cursorOperator]: task.createdAt } },
        {
          createdAt: task.createdAt,
          _id: { [cursorOperator]: task._id },
        },
      ],
    });

    let query: Record<string, unknown> = { ...scopeQuery };

    if (cursor) {
      const cursorTask = await TaskService.findOne({
        _id: cursor,
        ...scopeQuery,
      }).lean();

      if (!cursorTask) {
        throw errors.NOT_FOUND({
          data: { message: `Task cursor ${cursor} not found` },
        });
      }

      query = {
        ...query,
        ...getAfterCursorQuery(cursorTask),
      };
    }

    const tasks = await TaskService.find(query).lean().sort({ createdAt: sortDirection, _id: sortDirection }).limit(PAGE_SIZE);

    const lastTask = tasks.at(-1);

    const hasMore = lastTask
      ? await TaskService.exists({
          ...scopeQuery,
          ...getAfterCursorQuery(lastTask),
        })
      : false;

    return {
      tasks,
      nextCursor: hasMore && lastTask ? lastTask._id : undefined,
    };
  }),

  getOpenTasks: protectedProcedure.tasks.getOpenTasks.handler(({ input, errors }) => {
    if (input?.classroomId) {
      return TaskService.find({ completion: { $exists: false }, classroomId: input.classroomId })
        .lean()
        .sort({ createdAt: -1 });
    }
    return TaskService.find({ completion: { $exists: false } })
      .lean()
      .sort({ createdAt: -1 });
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
      return true;
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),

  editTask: protectedProcedure.tasks.editTask.handler(async ({ input, errors, context }) => {
    const task = await TaskService.findById(input._id).lean();
    if (!task) throw errors.NOT_FOUND({ data: { message: `Task with id ${input._id} not found` } });
    const isAdmin = context.user.role === "admin";

    const updatedTask: z.infer<typeof taskSchema> = {
      ...task,
      task: {
        ...task.task,
        description: input.description,
        urgent: input.urgent,
        visibleAt: input.visibleAt,
        completeBy: input.completeBy,
        createdBy: input.createdBy || task.task.createdBy,
      },
      edited: {
        editedBy: context.user.email,
        editDate: new Date(),
      },
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

    if (updatedTask.completion) updatedTask.task.visibleAt = undefined;

    const isValid = taskSchema.safeParse(updatedTask);
    if (!isValid.success) throw errors.INTERNAL_SERVER_ERROR({ data: { message: isValid.error.message } });

    try {
      await TaskService.replaceOne({ _id: input._id }, updatedTask).lean();
      return true;
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),

  deleteTask: protectedProcedure.tasks.deleteTask.handler(async ({ input, errors }) => {
    const task = await TaskService.findById(input.taskId).lean();
    if (!task) throw errors.NOT_FOUND({ data: { message: `Task with id ${input.taskId} not found` } });

    try {
      await TaskService.findByIdAndDelete(input.taskId).lean();
      return true;
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),
};
