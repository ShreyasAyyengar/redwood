import { oc } from "@orpc/contract";
import z from "zod";
import {
  bulkTaskFormSchema,
  bulkTaskMutationResult,
  taskFeedFilterSchema,
  taskMutationResult,
  taskSchema,
  taskTemplateSchema,
  uiTaskFormSchema,
} from "./task-schemas";

export const taskContract = {
  addTask: oc
    .route({
      method: "POST",
    })
    .input(uiTaskFormSchema.extend({ classroomId: z.uuidv7() }))
    .output(taskMutationResult)
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      UNPROCESSABLE_CONTENT: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  bulkAddTasks: oc
    .route({
      method: "POST",
    })
    .input(bulkTaskFormSchema)
    .output(bulkTaskMutationResult)
    .errors({
      UNPROCESSABLE_CONTENT: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  deleteTask: oc
    .route({
      method: "DELETE",
    })
    .input(z.object({ taskId: taskSchema.shape._id }))
    .output(taskMutationResult)
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  editTask: oc
    .route({
      method: "PUT",
    })
    .input(uiTaskFormSchema.extend({ _id: z.uuidv7() }))
    .output(taskMutationResult)
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  getTasks: oc
    .route({
      method: "GET",
    })
    .input(
      z.object({
        filter: taskFeedFilterSchema.optional(),
        direction: z.enum(["OLDEST_FIRST", "NEWEST_FIRST"]),
        cursor: taskSchema.shape._id.optional(),
      })
    )
    .output(
      z.object({
        tasks: z.array(taskSchema),
        nextCursor: taskSchema.shape._id.optional(),
      })
    )
    .errors({
      NOT_FOUND: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  getOpenTasks: oc
    .route({
      method: "GET",
    })
    .input(z.object({ classroomId: z.string().optional() }).optional()) // double .optional() is to allow for no input on frontend
    .output(z.array(taskSchema))
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  addTaskTemplate: oc
    .route({
      method: "POST",
    })
    .input(taskTemplateSchema.omit({ _id: true }))
    .output(taskTemplateSchema)
    .errors({
      UNPROCESSABLE_CONTENT: {
        data: z.object({
          message: z.string(),
        }),
      },
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  getTaskTemplates: oc
    .route({
      method: "GET",
    })
    .output(z.array(taskTemplateSchema))
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),
};
