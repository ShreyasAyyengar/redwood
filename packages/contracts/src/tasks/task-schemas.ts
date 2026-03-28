import { z } from "zod";

export const taskSchema = z.object({
  _id: z.uuidv7(),
  classroomId: z.uuidv7(),

  task: z.object({
    createdBy: z.email(),
    createdAt: z.coerce.date(),
    description: z.string("Task description is required.").min(1, "Task description is required."),
    urgent: z.boolean(),
    visibleAt: z.coerce.date().optional(),
    completeBy: z.coerce.date().optional(),
  }),

  edited: z
    .object({
      editedBy: z.email(),
      editDate: z.coerce.date(),
    })
    .optional(),

  completion: z
    .object({
      completedBy: z.email().optional(),
      comment: z.string().optional(),
      completionDate: z.coerce.date().optional(),
    })
    .optional(),
});

export const taskFormSchema = z.object({
  task: z.object({
    description: z.string().min(1, "Task description is required."),
    urgent: z.boolean(),
    visibleAt: z.coerce.date().optional(),
    completeBy: z.coerce.date().optional(),
  }),
});

export const createTaskRequestSchema = taskFormSchema.extend({ classroomId: z.uuidv7() });
