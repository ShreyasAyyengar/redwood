import { z } from "zod";

export const commonAdminNotesSchema = z.enum(["Escalated to MSE"]);

export const taskSchema = z.object({
  _id: z.uuidv7(),
  classroomId: z.uuidv7(),

  issue: z.object({
    reportedBy: z.email(),
    description: z.string(),
    sodEntered: z.boolean().optional(),
    cruzfixId: z.string().optional(),
    visibleAt: z.date().optional(), // scheduled tasks
    completeBy: z.date().optional(), // if past, goes into overdue tasks.

    urgent: z.boolean(),
    supervisorNeeded: z.boolean(),
  }),

  resolution: z
    .object({
      resolvedBy: z.email().optional(),
      comment: z.string().optional(),
    })
    .optional(),

  adminNotes: z.array(z.union([commonAdminNotesSchema, z.string()])),
});

export const maintenanceEntrySchema = z.object({
  _id: z.uuidv7(),
  classroomId: z.uuidv7(),
  date: z.date(),
  completedBy: z.email(),
  tasksAdded: z.array(z.uuidv7()),
});
