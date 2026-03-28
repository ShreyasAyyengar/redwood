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
