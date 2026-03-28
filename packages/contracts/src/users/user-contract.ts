import { oc } from "@orpc/contract";
import { z } from "zod";
import { basicUserSchema, userSchema } from "./user-schemas";

export const userContract = {
  createCredentials: oc
    .route({
      method: "POST",
    })
    .input(basicUserSchema)
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

  removeCredentials: oc
    .route({
      method: "DELETE",
    })
    .input(z.object({ email: basicUserSchema.shape.email }))
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
    .input(z.object({ email: basicUserSchema.shape.email, newRole: userSchema.shape.role }))
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
    .input(z.object({}))
    .output(z.array(basicUserSchema))
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),
};
