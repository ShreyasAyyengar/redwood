import { z } from "zod";

export const commonAdminNotesSchema = z.enum(["Escalated to MSE"]);

export const issueSchema = z.object({
  _id: z.uuidv7(),
  classroomId: z.uuidv7(),

  issue: z.object({
    reportedBy: z.email(),
    description: z.string(),
    sodEntered: z.boolean().optional(),
    cruzfixId: z.string().optional(),
    urgent: z.boolean(),
    supervisorNeeded: z.boolean(),
  }),

  resolution: z
    .object({
      resolvedBy: z.email().optional(),
      comment: z.string().optional(),
    })
    .optional(),

  adminNotes: z.array(z.union([commonAdminNotesSchema, z.string()])),
});

export const taskSchema = z.object({
  _id: z.uuidv7(),
  classroomId: z.uuidv7(),

  issue: z.object({
    createdBy: z.email(),
    description: z.string(),
    urgent: z.boolean(),
  }),

  completion: z
    .object({
      completedBy: z.email().optional(),
      comment: z.string().optional(),
    })
    .optional(),
});

export const maintenanceEntrySchema = z.object({
  _id: z.uuidv7(),
  classroomId: z.uuidv7(),
  date: z.coerce.date(),
  completedBy: z.email(),
  issuesAdded: z.array(z.uuidv7()),
});
