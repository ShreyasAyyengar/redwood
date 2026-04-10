import { z } from "zod";
import { basicUserSchema } from "../users/user-schemas";

export const attributeSchema = z.object({
  label: z.string(),
  color: z.string(),
});

export const configurationSchema = z.object({
  users: z.array(basicUserSchema),
  roomGroups: z.array(z.string()),
  attributes: z.array(attributeSchema),
});
