import { oc } from "@orpc/contract";
import { z } from "zod";

export const userSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.email(),
  image: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  role: z.enum(["employee", "supervisor", "admin"]),
});

export const basicUserSchema = z.object({
  email: userSchema.shape.email,
  role: userSchema.shape.role,
});

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
};
