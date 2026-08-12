import { paginationOptsValidator } from "convex/server";
import { ConvexError } from "convex/values";
import { stream } from "convex-helpers/server/stream";
import { withSystemFields } from "convex-helpers/server/zod";
import { convexToZod, zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import { authComponent } from "../../auth.ts";
import { protectedMutation, protectedQuery } from "../../lib/procedures.ts";
import schema from "../../schema.ts";
import {
  bulkIssueFormSchema,
  FINDINGS_OPTIONS,
  type issueFeedDateRangeFilterSchema,
  issueFeedFilterSchema,
  issueSchema,
  uiIssueFormSchema,
} from "./schemas.ts";

export const issueDoc = z.object(withSystemFields("issues", issueSchema.shape));

type Issue = z.infer<typeof issueSchema>;
type IssueFeedFilter = z.infer<typeof issueFeedFilterSchema>;
type IssueFeedDateRangeFilter = z.infer<typeof issueFeedDateRangeFilterSchema>;

function isInDateRange(value: string | undefined, range: IssueFeedDateRangeFilter | undefined) {
  if (!range) return true;
  if (!value) return false;

  const valueTime = Date.parse(value);
  if (range.from && valueTime < Date.parse(range.from)) return false;

  if (range.to) {
    const end = new Date(range.to);
    end.setUTCDate(end.getUTCDate() + 1);
    if (valueTime >= end.getTime()) return false;
  }

  return true;
}

function matchesScope(issue: Issue, filters: IssueFeedFilter, groupClassroomIds: Set<string> | undefined) {
  if (filters.classroomId) return issue.classroomId === filters.classroomId;
  return !groupClassroomIds || groupClassroomIds.has(issue.classroomId);
}

function matchesState(issue: Issue, filters: IssueFeedFilter) {
  const isResolved = issue.resolution !== undefined;

  if (filters.status && isResolved !== (filters.status === "RESOLVED")) return false;
  if (!isInDateRange(issue.issue.reportedAt, filters.created)) return false;
  if (!isInDateRange(issue.resolution?.resolvedAt, filters.resolved)) return false;
  if (filters.onHold !== undefined && issue.issue.onHold !== filters.onHold) return false;

  return true;
}

function matchesFlags(issue: Issue, filters: IssueFeedFilter) {
  if (filters.urgent && !issue.issue.urgent) return false;
  if (filters.supervisorNeeded && !issue.issue.supervisorNeeded) return false;
  if (filters.hasSodId && !issue.issue.sodId?.trim()) return false;
  if (filters.hasCruzfixId && !issue.issue.cruzfixId?.trim()) return false;
  if (filters.hasFindings && !issue.resolution?.findings?.length) return false;

  return true;
}

function matchesSearch(issue: Issue, filters: IssueFeedFilter) {
  const search = filters.search?.trim().toLocaleLowerCase();
  if (!search) return true;

  const descriptionMatches = issue.issue.description.toLocaleLowerCase().includes(search);
  const resolutionMatches = issue.resolution?.comment.toLocaleLowerCase().includes(search) ?? false;
  return descriptionMatches || resolutionMatches;
}

function matchesIssue(issue: Issue, view: "OPEN" | "ALL", filters: IssueFeedFilter | undefined, groupClassroomIds: Set<string> | undefined) {
  const isOpen = issue.resolution === undefined && !issue.issue.onHold;
  if (view === "OPEN" && !isOpen) return false;
  if (!filters) return true;

  return (
    matchesScope(issue, filters, groupClassroomIds) &&
    matchesState(issue, filters) &&
    matchesFlags(issue, filters) &&
    matchesSearch(issue, filters)
  );
}

export const getIssues = protectedQuery({
  args: z.object({
    view: z.enum(["OPEN", "ALL"]),
    filters: issueFeedFilterSchema.optional(),
    paginationOpts: convexToZod(paginationOptsValidator),
  }),

  handler: async (ctx, args) => {
    const { filters, view } = args;
    const classroomId = filters?.classroomId;

    let groupClassroomIds: Set<string> | undefined;
    if (filters?.group && !classroomId) {
      const { group } = filters;
      const classrooms = await ctx.db
        .query("classrooms")
        .withIndex("byGroupKey", (query) => query.eq("groupKey", group))
        .collect();
      groupClassroomIds = new Set(classrooms.map((classroom) => classroom._id));
    }

    const inferredStatus = filters?.status ?? (filters?.resolved || filters?.hasFindings ? "RESOLVED" : undefined);
    const indexedStatus = view === "OPEN" ? "UNRESOLVED" : inferredStatus;
    const issues = stream(ctx.db, schema);

    const orderedIssues = classroomId
      ? indexedStatus
        ? issues
            .query("issues")
            .withIndex("byClassroomIdAndFeed", (query) => query.eq("classroomId", classroomId).eq("feedStatus", indexedStatus))
            .order("desc")
        : issues
            .query("issues")
            .withIndex("byClassroomIdAndFeed", (query) => query.eq("classroomId", classroomId))
            .order("desc")
      : indexedStatus
        ? issues
            .query("issues")
            .withIndex("byFeed", (query) => query.eq("feedStatus", indexedStatus))
            .order("desc")
        : issues.query("issues").withIndex("byFeed").order("desc");

    return orderedIssues
      .filterWith(async (issue) => matchesIssue(issue, view, filters, groupClassroomIds))
      .paginate({
        ...args.paginationOpts,
      });
  },
});

export const getActiveIssues = protectedQuery({
  args: z.object({
    classroomId: zid("classrooms").optional(),
  }),
  returns: z.array(issueDoc),
  handler: (ctx, { classroomId }) => {
    if (classroomId) {
      return ctx.db
        .query("issues")
        .withIndex("byClassroomIdAndFeed", (query) => query.eq("classroomId", classroomId).eq("feedStatus", "UNRESOLVED"))
        .order("desc")
        .collect();
    }

    return ctx.db
      .query("issues")
      .withIndex("byFeed", (query) => query.eq("feedStatus", "UNRESOLVED"))
      .order("desc")
      .collect();
  },
});

export const createIssue = protectedMutation({
  args: uiIssueFormSchema.extend({ classroomId: zid("classrooms") }),
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const newIssue: z.infer<typeof issueSchema> = {
      createdAt: new Date().toISOString(),
      createdBy: user.email,
      classroomId: args.classroomId,

      issue: {
        description: args.description,
        urgent: args.urgent,
        supervisorNeeded: args.supervisorNeeded,
        cruzfixId: args.cruzfixId,
        sodId: args.sodId,
        onHold: args.onHold,
        reportedBy: user.email,
        reportedAt: new Date().toISOString(),
      },

      feedDate: new Date().toISOString(),
      feedStatus: "UNRESOLVED",
    };

    await ctx.db.insert("issues", newIssue);
  },
});

export const createBulkIssues = protectedMutation({
  args: bulkIssueFormSchema,
  handler: async (ctx, args) => {
    const selectedClassrooms = new Set(args.classroomIds);
    const selectedAttributes = new Set(args.attributeIds);

    const classrooms = await ctx.db.query("classrooms").collect();

    const ids = classrooms
      .filter(
        (classroom) => selectedClassrooms.has(classroom._id) || classroom.attributes.some((attributeId) => selectedAttributes.has(attributeId))
      )
      .map((classroom) => classroom._id);

    const user = await authComponent.getAuthUser(ctx);
    const now = new Date().toISOString();
    const newIssues: z.infer<typeof issueSchema>[] = ids.map((classroomId) => ({
      createdAt: now,
      createdBy: user.email,
      classroomId,
      issue: {
        description: args.description,
        urgent: args.urgent,
        supervisorNeeded: args.supervisorNeeded,
        cruzfixId: args.cruzfixId,
        sodId: args.sodId,
        onHold: args.onHold,
        reportedBy: user.email,
        reportedAt: now,
      },

      feedDate: now,
      feedStatus: "UNRESOLVED",
    }));

    await Promise.all(newIssues.map((issue) => ctx.db.insert("issues", issue)));
  },
});

export const deleteIssue = protectedMutation({
  args: issueDoc.pick({ _id: true }),
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, args) => {
    await ctx.db.delete("issues", args._id);
    return { success: true };
  },
});

export const editIssue = protectedMutation({
  args: uiIssueFormSchema.extend({ _id: zid("issues") }),
  handler: async (ctx, args) => {
    const issueDocument = await ctx.db.get("issues", args._id);
    if (!issueDocument) throw new ConvexError({ code: "NOT_FOUND", message: `Issue with id ${args._id} not found` });

    const user = await authComponent.getAuthUser(ctx);
    const isAdmin = user.role === "admin";
    const now = new Date().toISOString();

    // Conditionally allowed for admins
    const newReportedBy = isAdmin ? (args.reportedBy ?? issueDocument.issue.reportedBy) : issueDocument.issue.reportedBy;
    const newReportedAt = isAdmin ? (args.reportedAt ?? issueDocument.issue.reportedAt) : issueDocument.issue.reportedAt;

    const nonResolutionChanged =
      args.description !== issueDocument.issue.description ||
      args.urgent !== issueDocument.issue.urgent ||
      args.supervisorNeeded !== issueDocument.issue.supervisorNeeded ||
      args.cruzfixId !== issueDocument.issue.cruzfixId ||
      args.sodId !== issueDocument.issue.sodId ||
      args.onHold !== issueDocument.issue.onHold ||
      newReportedBy !== issueDocument.issue.reportedBy ||
      new Date(newReportedAt).getTime() !== new Date(issueDocument.issue.reportedAt).getTime();

    const updatedIssue: z.infer<typeof issueSchema> = {
      ...issueDocument,
      issue: {
        ...issueDocument.issue,
        description: args.description,
        urgent: args.urgent,
        supervisorNeeded: args.supervisorNeeded,
        cruzfixId: args.cruzfixId,
        sodId: args.sodId,
        onHold: args.onHold,
        reportedBy: newReportedBy,
        reportedAt: newReportedAt,
      },

      // if the resolution existed and was changed, mark as edited
      // if any other field was changed, mark as edited
      ...((nonResolutionChanged || (issueDocument.resolution && args.resolution !== issueDocument.resolution)) && {
        edited: {
          editedBy: user.email,
          editDate: now,
        },
      }),

      // if input.resolution is provided, update resolution, else make it undefined
      ...(!args.onHold && args.resolution
        ? {
            resolution: {
              // the resolvedBy can be different than the context, only if user is admin
              resolvedBy: isAdmin ? args.resolution.resolvedBy : user.email,
              resolvedAt: isAdmin ? args.resolution.resolvedAt : now,
              comment: args.resolution.comment,

              findings: issueDocument.resolution?.findings,
            },
          }
        : { resolution: undefined }),

      feedStatus: args.resolution ? "RESOLVED" : "UNRESOLVED",
      feedDate: args.resolution?.resolvedAt ?? issueDocument.issue.reportedAt,
    };

    await ctx.db.patch("issues", args._id, updatedIssue);
  },
});

export const setIssueFindings = protectedMutation({
  args: z.object({
    _id: zid("issues"),
    findings: z.array(z.enum(FINDINGS_OPTIONS)),
  }),
  handler: async (ctx, args) => {
    const issueDocument = await ctx.db.get("issues", args._id);
    if (!issueDocument) throw new ConvexError({ code: "NOT_FOUND", message: `Issue with id ${args._id} not found` });

    const updatedIssue: z.infer<typeof issueSchema> = {
      ...issueDocument,
      ...(issueDocument.resolution && {
        // if issue has a resolution
        resolution: {
          ...issueDocument.resolution,
          findings: args.findings,
        },
      }),
    };

    await ctx.db.patch("issues", args._id, updatedIssue);
  },
});
