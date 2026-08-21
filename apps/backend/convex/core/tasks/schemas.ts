import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";

export const taskDetailsSchema = z.object({
  createdBy: z.email(),
  createdAt: z.iso.datetime(),
  description: z.string("Task description is required.").min(1, "Task description is required."),
  urgent: z.boolean(),
  visibleAt: z.iso.datetime().optional(),
  supervisorNeeded: z.boolean(),
  completeBy: z.iso.datetime().optional(),
});

export const taskEditSchema = z.object({
  editedBy: z.email(),
  editDate: z.iso.datetime(),
});

export const taskCompletionSchema = z.object({
  completedBy: z.email(),
  comment: z.string().optional(),
  completedAt: z.iso.datetime(),
});

export const taskSchema = z.object({
  classroomId: zid("classrooms"),
  createdBy: z.email(), // non-editable
  createdAt: z.iso.datetime(), // non-editable
  task: taskDetailsSchema,
  edited: taskEditSchema.optional(),
  completion: taskCompletionSchema.optional(),

  // Derived fields used to reproduce the task feed's ordering in one index.
  // OPEN sorts before COMPLETED when the feed index is read descending.
  feedStatus: z.enum(["OPEN", "COMPLETED"]),
  feedDate: z.iso.datetime(),
});

export const taskFeedDateRangeFilterSchema = z.object({
  from: z.iso.datetime().optional(),
  to: z.iso.datetime().optional(),
});

export const taskFeedFilterSchema = z.object({
  classroomId: zid("classrooms").optional(),
  group: z.string().optional(),
  search: z.string().optional(),
  created: taskFeedDateRangeFilterSchema.optional(),
  completed: taskFeedDateRangeFilterSchema.optional(),
  status: z.enum(["OPEN", "COMPLETED"]).optional(),
  urgent: z.boolean().optional(),
  supervisorNeeded: z.boolean().optional(),
  hasDueDate: z.boolean().optional(),
});

export const uiTaskFormSchema = z.object({
  description: z.string().min(1, "Task description is required."),
  urgent: z.boolean(),
  supervisorNeeded: z.boolean(),
  visibleAt: z.iso.datetime().optional(),
  completeBy: z.iso.datetime().optional(),

  createdBy: z.email().optional(),
  createdAt: z.iso.datetime().optional(),

  // completion
  completion: z
    .object({
      comment: z.string().optional(),
      completedBy: z.email(),
      completedAt: z.iso.datetime(),
    })
    .optional(),
});

export const bulkTaskFormSchema = uiTaskFormSchema.extend({
  attributeIds: z.array(zid("attributes")).default([]),
  classroomIds: z.array(zid("classrooms")).default([]),
});

export const taskTemplateSchema = z.object({
  name: z.string().trim().min(1, "Task template name is required"),
  description: z.string().trim().min(1, "Task template description is required"),
  attributeIds: z.array(zid("attributes")).default([]),
  classroomIds: z.array(zid("classrooms")).default([]),
});
