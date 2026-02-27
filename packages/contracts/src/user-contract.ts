import { z } from "zod";

export const userSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.email(),
  image: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  role: z.enum(["employee", "supervisor", "admin"]),
});
