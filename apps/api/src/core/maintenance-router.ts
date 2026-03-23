import type { maintenanceEntrySchema, taskSchema } from "@redwood/contracts";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { ClassroomService } from "../database/classroom-service";
import { IssueService } from "../database/issue-service";
import { MaintenanceService } from "../database/maintenance-service";
import { TaskService } from "../database/task-service";
import { protectedProcedure } from "../libs/orpc-procedures";

export const maintenanceRouter = {
  addMaintenanceEntry: protectedProcedure.maintenance.addMaintenanceEntry.handler(async ({ input, errors, context }) => {
    console.log("received");
    const classroom = await ClassroomService.findById(input.classroomId);
    if (!classroom) throw errors.NOT_FOUND({ data: { message: `Classroom with id ${input.classroomId} not found` } });

    if (!classroom.isActive) throw errors.UNPROCESSABLE_CONTENT({ data: { message: `Classroom ${input.classroomId} is not active.` } });

    const newEntry: z.infer<typeof maintenanceEntrySchema> = {
      ...input,
      _id: uuidv7(),
      classroomId: input.classroomId,
      date: input.date,
      completedBy: context.user.email,
    };

    try {
      await ClassroomService.findByIdAndUpdate(input.classroomId, { lastMaintenance: { date: input.date, by: context.user.email } });
      await MaintenanceService.insertOne(newEntry);

      return true;
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),

  getHistory: protectedProcedure.maintenance.getHistory.handler(async ({ input, errors }) => {
    const { classroomId } = input;
    return await MaintenanceService.find({ classroomId }).sort({ date: -1 });
  }),

  getIssues: protectedProcedure.maintenance.getIssues.handler(async ({ input, errors }) => {
    const { classroomId } = input;
    const issues = await IssueService.find({ classroomId }).sort({ issueDate: -1 });
    return issues;
  }),

  getTasks: protectedProcedure.maintenance.getTasks.handler(async ({ input, errors }) => {
    const { classroomId } = input;
    const tasks = await TaskService.find({ classroomId }).sort({ createdAt: -1 });
    return tasks;
  }),

  addTask: protectedProcedure.maintenance.addTask.handler(async ({ input, errors, context }) => {
    const classroom = await ClassroomService.findById(input.classroomId);
    if (!classroom) throw errors.NOT_FOUND({ data: { message: `Classroom with id ${input.classroomId} not found` } });

    if (!classroom.isActive) throw errors.UNPROCESSABLE_CONTENT({ data: { message: `Classroom ${input.classroomId} is not active.` } });

    const newTask: z.infer<typeof taskSchema> = {
      ...input,
      _id: uuidv7(),
      classroomId: input.classroomId,
      task: { ...input.task, createdBy: context.user.email, createdAt: new Date() },
    };

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

  addIssue: protectedProcedure.maintenance.addIssue.handler(async ({ input, errors, context }) => {
    const classroom = await ClassroomService.findById(input.classroomId);
    if (!classroom) throw errors.NOT_FOUND({ data: { message: `Classroom with id ${input.classroomId} not found` } });

    const newIssue = {
      ...input,
      _id: uuidv7(),
      adminNotes: [],
      issue: {
        ...input.issue,
        reportedBy: context.user.email,
      },
    };

    try {
      await IssueService.insertOne(newIssue);
      return true;
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),
};
