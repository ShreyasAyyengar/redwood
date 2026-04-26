import { oc } from "@orpc/contract";
import z from "zod";
import { taskSchema, uiTaskFormSchema } from "./task-schemas";

export const taskContract = {
  addTask: oc
    .route({
      method: "POST",
    })
    .input(uiTaskFormSchema.extend({ classroomId: z.uuidv7() }))
    .output(z.boolean())
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

  deleteTask: oc
    .route({
      method: "DELETE",
    })
    .input(z.object({ taskId: taskSchema.shape._id }))
    .output(z.boolean())
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
    .output(z.boolean())
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

  resolveTask: oc
    .route({
      method: "PUT",
    })
    .input(taskSchema.pick({ _id: true, completion: true }))
    .output(z.boolean())
    .errors({
      FORBIDDEN: {
        data: z.object({
          message: z.string(),
        }),
      },
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
    .input(taskSchema.pick({ classroomId: true }))
    .output(z.array(taskSchema))
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

  // TODO paginate with inf queries
  getAllTasks: oc
    .route({
      method: "GET",
    })
    .input(
      z.object({
        openOnly: z.coerce.boolean().default(false),
      })
    )
    .output(z.array(taskSchema))
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
};
