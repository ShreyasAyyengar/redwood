import { oc } from "@orpc/contract";
import z from "zod";
import { classroomSchema } from "../rooms/classroom-contract";
import { createIssueRequestSchema, issueSchema, updateIssueRequestSchema } from "./issue-schemas";

export const issueContract = {
  createIssue: oc
    .route({
      method: "POST",
    })
    .input(createIssueRequestSchema)
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

  deleteIssue: oc
    .route({
      method: "DELETE",
    })
    .input(z.object({ issueId: issueSchema.shape._id }))
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

  editIssue: oc
    .route({
      method: "PUT",
    })
    .input(updateIssueRequestSchema)
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

  getIssues: oc
    .route({
      method: "GET",
    })
    .input(z.object({ classroomId: classroomSchema.shape._id }))
    .output(z.array(issueSchema))
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
