import { z } from "zod";

export const taskDetailsSchema = z.object({
  createdBy: z.email(),
  createdAt: z.coerce.date(),
  description: z.string("Task description is required.").min(1, "Task description is required."),
  urgent: z.boolean(),
  visibleAt: z.coerce.date().optional(),
  supervisorNeeded: z.boolean(),
  completeBy: z.coerce.date().optional(),
});

export const taskEditSchema = z.object({
  editedBy: z.email(),
  editDate: z.coerce.date(),
});

export const taskCompletionSchema = z.object({
  completedBy: z.email(),
  comment: z.string().optional(),
  completedAt: z.coerce.date(),
});

export const taskSchema = z.object({
  _id: z.uuidv7(),
  classroomId: z.uuidv7(),
  createdBy: z.email(), // non-editable
  createdAt: z.coerce.date(), // non-editable
  task: taskDetailsSchema,
  edited: taskEditSchema.optional(),
  completion: taskCompletionSchema.optional(),
});

export const uiTaskFormSchema = z.object({
  description: z.string().min(1, "Task description is required."),
  urgent: z.boolean(),
  supervisorNeeded: z.boolean(),
  visibleAt: z.coerce.date().optional(),
  completeBy: z.coerce.date().optional(),
  createdBy: z.email().optional(),

  // completion
  completion: z
    .object({
      comment: z.string().optional(),
      completedBy: z.email(),
      completedAt: z.coerce.date(),
    })
    .optional(),
});
