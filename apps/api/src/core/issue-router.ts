import { type classroomSchema, classroomSchemaPayload, type issueFeedFilterSchema, issueSchema } from "@redwood/contracts";
import { v7 as uuidv7 } from "uuid";
import type { z } from "zod";
import { ClassroomService } from "../database/classroom-service";
import { IssueService } from "../database/issue-service";
import { adminProcedure, protectedProcedure } from "../libs/orpc-procedures";

const PAGE_SIZE = 5;
const NEWEST_FIRST = -1 as const;

type Issue = z.infer<typeof issueSchema>;
type IssueFeedFilter = z.infer<typeof issueFeedFilterSchema>;
type IssueFeedQuery = {
  baseQuery: Record<string, unknown>;
  onlyResolved: boolean;
  onlyUnresolved: boolean;
};

const getAfterDateCursorQuery = (datePath: string, date: Date, id: string, cursorOperator: "$lt" | "$gt") => ({
  $or: [
    { [datePath]: { [cursorOperator]: date } },
    {
      [datePath]: date,
      _id: { [cursorOperator]: id },
    },
  ],
});

function andQuery(...queries: Record<string, unknown>[]): Record<string, unknown> {
  const activeQueries = queries.filter((query) => Object.keys(query).length > 0);
  if (activeQueries.length === 0) return {};
  if (activeQueries.length === 1) return activeQueries[0] ?? {};
  return { $and: activeQueries };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getDateRangeQuery(range: { from?: Date; to?: Date } | undefined) {
  if (!(range?.from || range?.to)) return;

  const query: Record<string, Date> = {};
  if (range.from) query.$gte = range.from;
  if (range.to) {
    const end = new Date(range.to);
    end.setDate(end.getDate() + 1);
    query.$lt = end;
  }

  return query;
}

async function getIssueFeedQuery(filter: IssueFeedFilter | undefined): Promise<IssueFeedQuery> {
  const scopeQuery: Record<string, unknown> = {};

  if (filter?.classroomId) {
    scopeQuery.classroomId = filter.classroomId;
  } else if (filter?.group) {
    const classroomIds = await ClassroomService.distinct("_id", { groupKey: filter.group });
    scopeQuery.classroomId = { $in: classroomIds };
  }

  const search = filter?.search?.trim();
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    scopeQuery.$or = [{ "issue.description": regex }, { "resolution.comment": regex }];
  }

  const createdRangeQuery = getDateRangeQuery(filter?.created);
  if (createdRangeQuery) scopeQuery["issue.reportedAt"] = createdRangeQuery;

  const resolvedRangeQuery = getDateRangeQuery(filter?.resolved);
  if (resolvedRangeQuery) scopeQuery["resolution.resolvedAt"] = resolvedRangeQuery;

  if (filter?.urgent) scopeQuery["issue.urgent"] = true;
  if (filter?.supervisorNeeded) scopeQuery["issue.supervisorNeeded"] = true;
  if (filter?.hasSodId) scopeQuery["issue.sodId"] = { $exists: true, $ne: "" };
  if (filter?.hasCruzfixId) scopeQuery["issue.cruzfixId"] = { $exists: true, $ne: "" };
  if (filter?.hasFindings) scopeQuery["resolution.findings.0"] = { $exists: true };

  return {
    baseQuery: scopeQuery,
    onlyResolved: filter?.status === "RESOLVED" || Boolean(resolvedRangeQuery) || Boolean(filter?.hasFindings),
    onlyUnresolved: filter?.status === "UNRESOLVED",
  };
}

async function getIssueCursor(cursor: string | undefined, query: IssueFeedQuery) {
  if (!cursor) return;

  const issue = await IssueService.findOne({
    _id: cursor,
    ...query.baseQuery,
  }).lean();

  return (issue as Issue | null) ?? undefined;
}

function getIssueStatusQuery(query: IssueFeedQuery) {
  if (query.onlyResolved) return { resolution: { $exists: true } };
  if (query.onlyUnresolved) return { resolution: { $exists: false } };
  return {};
}

async function getOldestIssuePage(query: IssueFeedQuery, cursorIssue: Issue | undefined) {
  const getAfterCursorQuery = (issue: Issue) => getAfterDateCursorQuery("issue.reportedAt", issue.issue.reportedAt, issue._id, "$gt");
  const issueQuery = andQuery(query.baseQuery, getIssueStatusQuery(query), cursorIssue ? getAfterCursorQuery(cursorIssue) : {});
  const issues = await IssueService.find(issueQuery).lean().sort({ "issue.reportedAt": 1, _id: 1 }).limit(PAGE_SIZE);
  const lastIssue = issues.at(-1);
  const hasMore = lastIssue
    ? await IssueService.exists(andQuery(query.baseQuery, getIssueStatusQuery(query), getAfterCursorQuery(lastIssue)))
    : false;

  return {
    issues,
    nextCursor: hasMore && lastIssue ? lastIssue._id : undefined,
  };
}

async function getNewestIssueFeedPage(query: IssueFeedQuery, cursorIssue: Issue | undefined) {
  const issues: Issue[] = [];

  if (!(query.onlyResolved || cursorIssue?.resolution)) {
    const activeCursorQuery = cursorIssue
      ? getAfterDateCursorQuery("issue.reportedAt", cursorIssue.issue.reportedAt, cursorIssue._id, "$lt")
      : {};
    const activeIssues = (await IssueService.find(andQuery(query.baseQuery, { resolution: { $exists: false } }, activeCursorQuery))
      .lean()
      .sort({ "issue.reportedAt": NEWEST_FIRST, _id: NEWEST_FIRST })
      .limit(PAGE_SIZE)) as Issue[];

    issues.push(...activeIssues);
  }

  if (issues.length < PAGE_SIZE && !query.onlyUnresolved) {
    const resolvedCursorQuery = cursorIssue?.resolution
      ? getAfterDateCursorQuery("resolution.resolvedAt", cursorIssue.resolution.resolvedAt, cursorIssue._id, "$lt")
      : {};
    const resolvedIssues = (await IssueService.find(andQuery(query.baseQuery, { resolution: { $exists: true } }, resolvedCursorQuery))
      .lean()
      .sort({ "resolution.resolvedAt": NEWEST_FIRST, _id: NEWEST_FIRST })
      .limit(PAGE_SIZE - issues.length)) as Issue[];

    issues.push(...resolvedIssues);
  }

  const lastIssue = issues.at(-1);
  const hasMore = lastIssue ? await hasMoreNewestIssuesAfter(query, lastIssue) : false;

  return {
    issues,
    nextCursor: hasMore && lastIssue ? lastIssue._id : undefined,
  };
}

async function hasMoreNewestIssuesAfter(query: IssueFeedQuery, issue: Issue) {
  if (issue.resolution) {
    return Boolean(
      await IssueService.exists(
        andQuery(
          query.baseQuery,
          { resolution: { $exists: true } },
          getAfterDateCursorQuery("resolution.resolvedAt", issue.resolution.resolvedAt, issue._id, "$lt")
        )
      )
    );
  }

  const hasMoreActiveIssues = await IssueService.exists(
    andQuery(
      query.baseQuery,
      { resolution: { $exists: false } },
      getAfterDateCursorQuery("issue.reportedAt", issue.issue.reportedAt, issue._id, "$lt")
    )
  );
  const hasResolvedIssues = !query.onlyUnresolved && (await IssueService.exists(andQuery(query.baseQuery, { resolution: { $exists: true } })));

  return Boolean(hasMoreActiveIssues || hasResolvedIssues);
}

export const issueRouter = {
  getIssues: protectedProcedure.issues.getIssues.handler(async ({ input, errors }) => {
    const query = await getIssueFeedQuery(input.filter);
    const cursorIssue = await getIssueCursor(input.cursor, query);

    if (query.onlyUnresolved && query.onlyResolved) {
      return { issues: [], nextCursor: undefined };
    }

    if (input.cursor && !cursorIssue) {
      throw errors.NOT_FOUND({
        data: { message: `Issue cursor ${input.cursor} not found` },
      });
    }

    return input.direction === "OLDEST_FIRST" ? getOldestIssuePage(query, cursorIssue) : getNewestIssueFeedPage(query, cursorIssue);
  }),

  getActiveIssues: protectedProcedure.issues.getActiveIssues.handler(({ input }) => {
    if (input?.classroomId) {
      return IssueService.find({ resolution: { $exists: false }, classroomId: input.classroomId })
        .lean()
        .sort({ "issue.reportedAt": -1, _id: -1 });
    }

    return IssueService.find({ resolution: { $exists: false } })
      .lean()
      .sort({ "issue.reportedAt": -1, _id: -1 });
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

      return {
        mutatedIssue: newIssue,
        roomSnapshot: await getRoomSnapshot(newIssue.classroomId),
      };
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),

  bulkCreateIssues: adminProcedure.issues.bulkCreateIssues.handler(async ({ input, errors, context }) => {
    const targetClassrooms = await findBulkTargetClassrooms({
      attributeIds: input.attributeIds,
      classroomIds: input.classroomIds,
    });

    if (targetClassrooms.length === 0) {
      throw errors.UNPROCESSABLE_CONTENT({ data: { message: "Select at least one classroom for bulk issue creation." } });
    }

    const now = new Date();
    const newIssues: z.infer<typeof issueSchema>[] = targetClassrooms.map((classroom) => ({
      _id: uuidv7(),
      createdAt: now,
      createdBy: context.user.email,
      classroomId: classroom._id,
      issue: {
        description: input.description,
        urgent: input.urgent,
        supervisorNeeded: input.supervisorNeeded,
        cruzfixId: input.cruzfixId,
        sodId: input.sodId,
        reportedBy: context.user.email,
        reportedAt: now,
      },
    }));

    const isValid = issueSchema.array().safeParse(newIssues);
    if (!isValid.success) throw errors.INTERNAL_SERVER_ERROR({ data: { message: isValid.error.message } });

    try {
      await IssueService.insertMany(newIssues);
      await Promise.all(newIssues.map((issue) => recomputeRoomStatus(issue.classroomId)));

      return {
        mutatedIssues: newIssues,
        roomSnapshots: await Promise.all(newIssues.map((issue) => getRoomSnapshot(issue.classroomId))),
      };
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),

  editIssue: protectedProcedure.issues.editIssue.handler(async ({ input, errors, context }) => {
    const issue = await IssueService.findById(input._id).lean();
    if (!issue) throw errors.NOT_FOUND({ data: { message: `Issue with id ${input._id} not found` } });
    const isAdmin = context.user.role === "admin";

    // Conditionally allowed for admins
    const newReportedBy = isAdmin ? (input.reportedBy ?? issue.issue.reportedBy) : issue.issue.reportedBy;
    const newReportedAt = isAdmin ? (input.reportedAt ?? issue.issue.reportedAt) : issue.issue.reportedAt;

    // Check if non-resolution fields were changed
    const nonResolutionChanged =
      input.description !== issue.issue.description ||
      input.urgent !== issue.issue.urgent ||
      input.supervisorNeeded !== issue.issue.supervisorNeeded ||
      input.cruzfixId !== issue.issue.cruzfixId ||
      input.sodId !== issue.issue.sodId ||
      newReportedBy !== issue.issue.reportedBy ||
      newReportedAt.getTime() !== issue.issue.reportedAt.getTime();

    const updatedIssue: z.infer<typeof issueSchema> = {
      ...issue,
      issue: {
        ...issue.issue,
        description: input.description,
        urgent: input.urgent,
        supervisorNeeded: input.supervisorNeeded,
        cruzfixId: input.cruzfixId,
        sodId: input.sodId,
        reportedBy: newReportedBy,
        reportedAt: newReportedAt,
      },

      // if the resolution existed and was changed, mark as edited
      // if any other field was changed, mark as edited
      ...((nonResolutionChanged || (issue.resolution && input.resolution !== issue.resolution)) && {
        edited: {
          editedBy: context.user.email,
          editDate: new Date(),
        },
      }),

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
      await recomputeRoomStatus(updatedIssue.classroomId);

      return {
        mutatedIssue: updatedIssue,
        roomSnapshot: await getRoomSnapshot(updatedIssue.classroomId),
      };
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),

  setIssueFindings: protectedProcedure.issues.setIssueFindings.handler(async ({ input, errors, context }) => {
    const issue = await IssueService.findById(input._id).lean();
    if (!issue) throw errors.NOT_FOUND({ data: { message: `Issue with id ${input._id} not found` } });

    const updatedIssue: z.infer<typeof issueSchema> = {
      ...issue,
      ...(issue.resolution ? { resolution: { ...issue.resolution, findings: input.findings } } : {}),
    };

    const isValid = issueSchema.safeParse(updatedIssue);
    if (!isValid.success) throw errors.INTERNAL_SERVER_ERROR({ data: { message: isValid.error.message } });

    try {
      await IssueService.replaceOne({ _id: input._id }, updatedIssue).lean();
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

      await recomputeRoomStatus(issue.classroomId);

      return {
        mutatedIssue: issue,
        roomSnapshot: await getRoomSnapshot(issue.classroomId),
      };
    } catch (e) {
      throw errors.INTERNAL_SERVER_ERROR({ data: { message: String(e) } });
    }
  }),
};

function findBulkTargetClassrooms({ attributeIds, classroomIds }: { attributeIds: string[]; classroomIds: string[] }) {
  const targetFilters: Record<string, unknown>[] = [];
  if (classroomIds.length > 0) targetFilters.push({ _id: { $in: classroomIds } });
  if (attributeIds.length > 0) targetFilters.push({ attributes: { $in: attributeIds } });

  if (targetFilters.length === 0) return [];

  return ClassroomService.find({
    $or: targetFilters,
  }).lean();
}

// todo classroom-router also uses this method, pls reuse.
async function getRoomSnapshot(classroomId: string): Promise<z.infer<typeof classroomSchemaPayload>> {
  const room = await ClassroomService.aggregate([
    { $match: { _id: classroomId } },
    {
      $lookup: {
        from: "issues",
        let: { roomId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$classroomId", "$$roomId"] },
              resolution: { $exists: false },
            },
          },
          { $count: "count" },
        ],
        as: "activeIssueCountResult",
      },
    },
    {
      $lookup: {
        from: "tasks",
        let: { roomId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$classroomId", "$$roomId"] },
              completion: { $exists: false },
              $or: [{ "task.visibleAt": { $exists: false } }, { "task.visibleAt": { $lte: new Date() } }],
            },
          },
          { $count: "count" },
        ],
        as: "taskCountResult",
      },
    },
    {
      $addFields: {
        activeIssuesCount: {
          $ifNull: [{ $arrayElemAt: ["$activeIssueCountResult.count", 0] }, 0],
        },
        openTasksCount: {
          $ifNull: [{ $arrayElemAt: ["$taskCountResult.count", 0] }, 0],
        },
      },
    },
    { $project: { activeIssueCountResult: 0, taskCountResult: 0 } },
  ]).then((results) => results[0]);

  return classroomSchemaPayload.parse(room);
}

export async function recomputeRoomStatus(classroomId: string) {
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
