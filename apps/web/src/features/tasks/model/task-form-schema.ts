import type { Doc } from "@backend/convex/_generated/dataModel";
import { z } from "zod";

export const taskFormSchema = z.object({
  description: z.string().min(1, "Task description is required."),
  urgent: z.boolean(),
  supervisorNeeded: z.boolean(),
  visibleAt: z.date().optional(),
  completeBy: z.date().optional(),
  createdBy: z.email().optional(),
  createdAt: z.date().optional(),
  completion: z
    .object({
      comment: z.string().optional(),
      completedBy: z.email(),
      completedAt: z.date(),
    })
    .optional(),
});

export type TaskFormValues = z.input<typeof taskFormSchema>;

export function getTaskFormValues(task?: Doc<"tasks">): TaskFormValues {
  return {
    description: task?.task.description ?? "",
    urgent: task?.task.urgent ?? false,
    supervisorNeeded: task?.task.supervisorNeeded ?? false,
    visibleAt: task?.task.visibleAt ? new Date(task.task.visibleAt) : undefined,
    completeBy: task?.task.completeBy ? new Date(task.task.completeBy) : undefined,
    createdBy: task?.task.createdBy,
    createdAt: task ? new Date(task.task.createdAt) : undefined,
    completion: task?.completion
      ? {
          comment: task.completion.comment,
          completedBy: task.completion.completedBy,
          completedAt: new Date(task.completion.completedAt),
        }
      : undefined,
  };
}

export function serializeTaskFormValues(values: TaskFormValues) {
  return {
    description: values.description,
    urgent: values.urgent,
    supervisorNeeded: values.supervisorNeeded,
    ...(values.visibleAt ? { visibleAt: values.visibleAt.toISOString() } : {}),
    ...(values.completeBy ? { completeBy: values.completeBy.toISOString() } : {}),
    ...(values.createdBy ? { createdBy: values.createdBy } : {}),
    ...(values.createdAt ? { createdAt: values.createdAt.toISOString() } : {}),
    ...(values.completion
      ? {
          completion: {
            ...values.completion,
            completedAt: values.completion.completedAt.toISOString(),
          },
        }
      : {}),
  };
}
