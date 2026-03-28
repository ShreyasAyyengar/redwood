import { taskSchema } from "@redwood/contracts";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { ClassroomService } from "../database/classroom-service";
import { TaskService } from "../database/task-service";
import { protectedProcedure } from "../libs/orpc-procedures";

export const taskRouter = {
  getTasks: protectedProcedure.tasks.getTasks.handler(async ({ input, errors }) => {
    const { classroomId } = input;
    const tasks = await TaskService.find({ classroomId }).sort({ createdAt: -1 });
    return tasks;
  }),

  addTask: protectedProcedure.tasks.addTask.handler(async ({ input, errors, context }) => {
    const classroom = await ClassroomService.findById(input.classroomId);
    if (!classroom) throw errors.NOT_FOUND({ data: { message: `Classroom with id ${input.classroomId} not found` } });

    if (!classroom.isActive) throw errors.UNPROCESSABLE_CONTENT({ data: { message: `Classroom ${input.classroomId} is not active.` } });

    const newTask: z.infer<typeof taskSchema> = {
      ...input,
      _id: uuidv7(),
      classroomId: input.classroomId,
      task: { ...input.task, createdBy: context.user.email, createdAt: new Date() },
    };

    const isValid = taskSchema.safeParse(newTask);
    if (!isValid.success) throw errors.INTERNAL_SERVER_ERROR({ data: { message: isValid.error.message } });

    try {
      await TaskService.insertOne(newTask);
      await ClassroomService.findByIdAndUpdate(input.classroomId, {
        $inc: { openTasksCount: !newTask.task.visibleAt ? 1 : 0 },
      });
      return true;
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),
};
