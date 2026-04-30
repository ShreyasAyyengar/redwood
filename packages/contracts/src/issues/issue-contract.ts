import { oc } from "@orpc/contract";
import z from "zod";
import { classroomSchema } from "../rooms/classroom-contract";
import { issueSchema, uiIssueFormSchema } from "./issue-schemas";

export const issueContract = {
  createIssue: oc
    .route({
      method: "POST",
    })
    .input(uiIssueFormSchema.extend({ classroomId: z.uuidv7() }))
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
    .input(uiIssueFormSchema.extend({ _id: z.uuidv7() }))
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

  getIssues: oc
    .route({
      method: "GET",
    })
    .input(
      z.object({
        classroomId: classroomSchema.shape._id.optional(),
        direction: z.enum(["OLDEST_FIRST", "NEWEST_FIRST"]),
        cursor: issueSchema.shape._id.optional(),
      })
    )
    .output(
      z.object({
        issues: z.array(issueSchema),
        nextCursor: issueSchema.shape._id.optional(),
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

  getOpenIssues: oc
    .route({
      method: "GET",
    })
    .input(z.object({ classroomId: issueSchema.shape.classroomId.optional() }))
    .output(z.array(issueSchema))
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),

  // TODO paginate with inf queries
  getAllIssues: oc
    .route({
      method: "GET",
    })
    .input(
      z.object({
        openOnly: z.coerce.boolean().default(false),
      })
    )
    .output(z.array(issueSchema))
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),
};
