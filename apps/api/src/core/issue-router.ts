import { type classroomSchema, issueSchema } from "@redwood/contracts";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { ClassroomService } from "../database/classroom-service";
import { IssueService } from "../database/issue-service";
import { protectedProcedure } from "../libs/orpc-procedures";

export const issueRouter = {
  getIssues: protectedProcedure.issues.getIssues.handler(async ({ input, errors }) => {
    const { classroomId } = input;
    const issues: z.infer<typeof issueSchema>[] = await IssueService.find({ classroomId }).lean().sort({ "issue.reportedAt": -1 });

    return issues;
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

      adminNotes: [],
    };

    const isValid = issueSchema.safeParse(newIssue);
    if (!isValid.success) throw errors.INTERNAL_SERVER_ERROR({ data: { message: isValid.error.message } });

    try {
      await IssueService.insertOne(newIssue);

      // biome-ignore lint/complexity/noVoid: fire-and-forget
      void recomputeRoomStatus(newIssue.classroomId);

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
        ? { resolution: { resolvedBy: context.user.email, resolvedAt: new Date(), comment: input.resolution.comment } }
        : { resolution: undefined }),
    };

    const isValid = issueSchema.safeParse(updatedIssue);
    if (!isValid.success) throw errors.INTERNAL_SERVER_ERROR({ data: { message: isValid.error.message } });

    try {
      await IssueService.replaceOne({ _id: input._id }, updatedIssue);

      // biome-ignore lint/complexity/noVoid: fire-and-forget
      void recomputeRoomStatus(updatedIssue.classroomId);

      return true;
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),

  deleteIssue: protectedProcedure.issues.deleteIssue.handler(async ({ input, errors }) => {
    const issue = await IssueService.findById(input.issueId).lean();
    if (!issue) throw errors.NOT_FOUND({ data: { message: `Issue with id ${input.issueId} not found` } });

    try {
      await IssueService.findByIdAndDelete(input.issueId);

      // biome-ignore lint/complexity/noVoid: fire-and-forget
      void recomputeRoomStatus(issue.classroomId);

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

    await ClassroomService.updateOne({ _id: classroomId }, { roomStatus: currentStatus });
  } catch (e) {
    console.error("Failed to recompute room status:", e);
  }
}
