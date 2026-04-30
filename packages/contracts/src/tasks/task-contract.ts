import { oc } from "@orpc/contract";
import z from "zod";
import { classroomSchema } from "../rooms/classroom-contract";
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
    .input(
      z.object({
        classroomId: classroomSchema.shape._id.optional(),
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
};
