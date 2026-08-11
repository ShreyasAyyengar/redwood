import { z } from "zod";

export const roles = ["employee", "supervisor", "admin"] as const;

export const redwoodUserSchema = z.object({
  email: z.email(),
  role: z.enum(roles),
});
