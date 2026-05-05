import { oc } from "@orpc/contract";
import z from "zod";
import { classroomSchema } from "../rooms/classroom-contract";
import { FINDINGS_OPTIONS, issueMutationResult, issueSchema, uiIssueFormSchema } from "./issue-schemas";

export const issueContract = {
  createIssue: oc
    .route({
      method: "POST",
    })
    .input(uiIssueFormSchema.extend({ classroomId: z.uuidv7() }))
    .output(issueMutationResult)
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
    .output(issueMutationResult)
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
    .output(issueMutationResult)
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

  setIssueFindings: oc
    .route({
      method: "PUT",
    })
    .input(
      z.object({
        _id: issueSchema.shape._id,
        findings: z.array(z.enum(FINDINGS_OPTIONS)),
      })
    )
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
        filter: z
          .object({
            classroomId: classroomSchema.shape._id.optional(),
            group: z.string().optional(),
          })
          .optional(),
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

  getActiveIssues: oc
    .route({
      method: "GET",
    })
    .input(z.object({ classroomId: z.string().optional() }).optional()) // double .optional() is to allow for no input on frontend
    .output(z.array(issueSchema))
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),
};
