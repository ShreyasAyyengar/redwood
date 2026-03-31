import { issueFormSchema, issueSchema } from "@redwood/contracts";
import { v7 as uuidv7 } from "uuid";
import { ClassroomService } from "../database/classroom-service";
import { IssueService } from "../database/issue-service";
import { protectedProcedure } from "../libs/orpc-procedures";

export const issueRouter = {
  getIssues: protectedProcedure.issues.getIssues.handler(async ({ input, errors }) => {
    const { classroomId } = input;
    const issues = await IssueService.find({ classroomId }).lean().sort({ issueDate: -1 });
    return issues;
  }),

  createIssue: protectedProcedure.issues.createIssue.handler(async ({ input, errors, context }) => {
    const classroom = await ClassroomService.findById(input.classroomId).lean();
    if (!classroom) throw errors.NOT_FOUND({ data: { message: `Classroom with id ${input.classroomId} not found` } });

    const newIssue = {
      ...input,
      _id: uuidv7(),
      adminNotes: [],
      issue: {
        ...input.issue,
        reportedBy: context.user.email,
      },
    };

    const isValid = issueFormSchema.safeParse(newIssue);
    if (!isValid.success) throw errors.INTERNAL_SERVER_ERROR({ data: { message: isValid.error.message } });

    try {
      await IssueService.insertOne(newIssue);
      return true;
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),

  editIssue: protectedProcedure.issues.editIssue.handler(async ({ input, errors, context }) => {
    const issue = await IssueService.findById(input._id).lean();
    if (!issue) throw errors.NOT_FOUND({ data: { message: `Issue with id ${input._id} not found` } });

    const updatedIssue = {
      ...issue,
      ...input,
    };

    const isValid = issueSchema.safeParse(updatedIssue);
    if (!isValid.success) throw errors.INTERNAL_SERVER_ERROR({ data: { message: isValid.error.message } });

    try {
      await IssueService.findByIdAndUpdate(input._id, updatedIssue);
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
      return true;
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),
};
