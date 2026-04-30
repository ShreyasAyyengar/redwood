import { type classroomSchema, issueSchema } from "@redwood/contracts";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { ClassroomService } from "../database/classroom-service";
import { IssueService } from "../database/issue-service";
import { protectedProcedure } from "../libs/orpc-procedures";

const PAGE_SIZE = 5;

export const issueRouter = {
  getIssues: protectedProcedure.issues.getIssues.handler(async ({ input, errors }) => {
    const { classroomId, direction, cursor } = input;

    const sortDirection = direction === "NEWEST_FIRST" ? -1 : 1;
    const cursorOperator = direction === "NEWEST_FIRST" ? "$lt" : "$gt";

    const getAfterCursorQuery = (issue: z.infer<typeof issueSchema>) => ({
      $or: [
        { "issue.reportedAt": { [cursorOperator]: issue.issue.reportedAt } },
        {
          "issue.reportedAt": issue.issue.reportedAt,
          _id: { [cursorOperator]: issue._id },
        },
      ],
    });

    const scopeQuery: Record<string, unknown> = classroomId ? { classroomId } : {};
    let query: Record<string, unknown> = { ...scopeQuery };

    if (cursor) {
      const cursorIssue = await IssueService.findOne({
        _id: cursor,
        ...scopeQuery,
      }).lean();

      if (!cursorIssue) {
        throw errors.NOT_FOUND({
          data: { message: `Issue cursor ${cursor} not found` },
        });
      }

      query = {
        ...query,
        ...getAfterCursorQuery(cursorIssue),
      };
    }

    const issues = await IssueService.find(query).lean().sort({ "issue.reportedAt": sortDirection, _id: sortDirection }).limit(PAGE_SIZE);

    const lastIssue = issues.at(-1);

    const hasMore = lastIssue
      ? await IssueService.exists({
          ...scopeQuery,
          ...getAfterCursorQuery(lastIssue),
        })
      : false;

    return {
      issues,
      nextCursor: hasMore && lastIssue ? lastIssue._id : undefined,
    };
  }),

  getActiveIssues: protectedProcedure.issues.getActiveTasks.handler(({ input }) => {
    if (input?.classroomId) {
      return IssueService.find({ resolution: { $exists: false }, classroomId: input.classroomId })
        .lean()
        .sort({ "issue.reportedAt": -1 });
    }

    return IssueService.find({ resolution: { $exists: false } })
      .lean()
      .sort({ "issue.reportedAt": -1 });
  }),

  getAllIssues: protectedProcedure.issues.getAllIssues.handler(({ input }) => {
    const { openOnly } = input;
    const query = openOnly ? { resolution: { $exists: false } } : {};

    return IssueService.find(query).lean().sort({ "issue.reportedAt": -1 });
  }),

  createIssue: protectedProcedure.issues.createIssue.handler(async ({ input, errors, context }) => {
    const classroom = await ClassroomService.findById(input.classroomId).lean();
    if (!classroom) throw errors.NOT_FOUND({ data: { message: `Classroom with id ${input.classroomId} not found` } });

    const newIssue: z.infer<typeof issueSchema> = {
      _id: uuidv7(),
      createdAt: new Date(),
      createdBy: context.user.email,
      classroomId: input.classroomId,

      issue: {
        description: input.description,
        urgent: input.urgent,
        supervisorNeeded: input.supervisorNeeded,
        cruzfixId: input.cruzfixId,
        sodId: input.sodId,
        reportedBy: context.user.email,
        reportedAt: new Date(),
      },
    };

    const isValid = issueSchema.safeParse(newIssue);
    if (!isValid.success) throw errors.INTERNAL_SERVER_ERROR({ data: { message: isValid.error.message } });

    try {
      await IssueService.insertOne(newIssue);

      recomputeRoomStatus(newIssue.classroomId);

      return true;
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),

  editIssue: protectedProcedure.issues.editIssue.handler(async ({ input, errors, context }) => {
    const issue = await IssueService.findById(input._id).lean();
    if (!issue) throw errors.NOT_FOUND({ data: { message: `Issue with id ${input._id} not found` } });
    const isAdmin = context.user.role === "admin";

    const updatedIssue: z.infer<typeof issueSchema> = {
      ...issue,
      issue: {
        ...issue.issue,
        // Always allowed for everyone
        description: input.description,
        urgent: input.urgent,
        supervisorNeeded: input.supervisorNeeded,
        cruzfixId: input.cruzfixId,
        sodId: input.sodId,
        // Conditionally allowed for admins
        reportedBy: isAdmin ? (input.reportedBy ?? issue.issue.reportedBy) : issue.issue.reportedBy,
        reportedAt: isAdmin ? (input.reportedAt ?? issue.issue.reportedAt) : issue.issue.reportedAt,
      },
      edited: {
        editedBy: context.user.email,
        editDate: new Date(),
      },

      // if input.resolution is provided, update resolution, else make it undefined
      ...(input.resolution
        ? {
            resolution: {
              // the resolvedBy can be different than the context, only if user is admin
              resolvedBy: isAdmin ? input.resolution.resolvedBy : context.user.email,
              resolvedAt: isAdmin ? input.resolution.resolvedAt : new Date(),
              comment: input.resolution.comment,
            },
          }
        : { resolution: undefined }),
    };

    const isValid = issueSchema.safeParse(updatedIssue);
    if (!isValid.success) throw errors.INTERNAL_SERVER_ERROR({ data: { message: isValid.error.message } });

    try {
      await IssueService.replaceOne({ _id: input._id }, updatedIssue).lean();
      recomputeRoomStatus(updatedIssue.classroomId);

      return true;
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),

  deleteIssue: protectedProcedure.issues.deleteIssue.handler(async ({ input, errors }) => {
    const issue = await IssueService.findById(input.issueId).lean();
    if (!issue) throw errors.NOT_FOUND({ data: { message: `Issue with id ${input.issueId} not found` } });

    try {
      await IssueService.findByIdAndDelete(input.issueId).lean();

      recomputeRoomStatus(issue.classroomId);

      return true;
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),
};

async function recomputeRoomStatus(classroomId: string) {
  try {
    const issues: z.infer<typeof issueSchema>[] = await IssueService.find({
      classroomId,
      resolution: { $exists: false },
    }).lean();

    let currentStatus: z.infer<typeof classroomSchema>["roomStatus"] = "GOOD";

    for (const issue of issues) {
      if (issue.issue.urgent) {
        currentStatus = "NEEDS URGENT ATTENTION";
        break;
      }
    }

    if (currentStatus === "GOOD" && issues.length > 0) currentStatus = "NEEDS ATTENTION";

    await ClassroomService.updateOne({ _id: classroomId }, { roomStatus: currentStatus }).lean();
  } catch (e) {
    console.error("Failed to recompute room status:", e);
  }
}
