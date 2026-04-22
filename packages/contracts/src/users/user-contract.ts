import { oc } from "@orpc/contract";
import { z } from "zod";
import { redwoodUserSchema, userSchema } from "./user-schemas";

export const userContract = {
  addUser: oc
    .route({
      method: "POST",
    })
    .input(redwoodUserSchema)
    .output(z.boolean())
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
      UNPROCESSABLE_CONTENT: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  removeUser: oc
    .route({
      method: "DELETE",
    })
    .input(z.object({ email: redwoodUserSchema.shape.email }))
    .output(z.boolean())
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
      UNPROCESSABLE_CONTENT: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  changeRole: oc
    .route({
      method: "PATCH",
    })
    .input(z.object({ email: redwoodUserSchema.shape.email, newRole: userSchema.shape.role }))
    .output(z.boolean())
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
      UNPROCESSABLE_CONTENT: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  getUsers: oc
    .route({
      method: "GET",
    })
    .output(z.array(redwoodUserSchema))
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),
};
