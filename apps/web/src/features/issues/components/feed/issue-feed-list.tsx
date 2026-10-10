"use client";

import { api } from "@backend/convex/_generated/api";
import type { Doc } from "@backend/convex/_generated/dataModel";
import { useConvex } from "convex/react";
import { usePaginatedQuery, useQuery } from "convex-helpers/react/cache/hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FeedEmptyState, FeedLoadingState, VirtualizedFeedList } from "#/features/feed/components/feed-list-layout.tsx";
import { FeedStatusIndicators } from "#/features/feed/components/feed-status-indicators.tsx";
import { FeedClassroomCell, FeedDateCell, FeedPreviewCell, FeedTextCell } from "#/features/feed/components/feed-table-cells.tsx";
import { type FeedView, FeedViewLayout } from "#/features/feed/components/feed-view-layout.tsx";
import { type FeedTableColumn, VirtualizedFeedTable } from "#/features/feed/components/virtualized-feed-table.tsx";
import { useFeedCount } from "#/features/feed/model/use-feed-count.ts";
import { type IssueFeedFilterValue, toIssueFeedFilters } from "../../model/issue-filters";
import { IssueFeedCard } from "../cards/issue-feed-card";
import { IssueDialog } from "../dialogs/issue-dialog";

const ISSUE_FEED_ROW_ESTIMATE_PX = 220;
const ISSUE_FEED_PAGE_SIZE = 20;

export function IssueFeedList({
  filter,
  openOnly,
  view,
  onViewChange,
}: {
  filter?: IssueFeedFilterValue;
  openOnly?: boolean;
  view: FeedView;
  onViewChange: (view: FeedView) => void;
}) {
  const filters = toIssueFeedFilters(filter);
  const args = { view: openOnly ? ("ACTIVE" as const) : ("ALL" as const), ...(filters ? { filters } : {}) };
  const convex = useConvex();
  const [selectedIssue, setSelectedIssue] = useState<Doc<"issues"> | null>(null);

  const {
    results: issues,
    status,
    loadMore,
  } = usePaginatedQuery(api.core.issues.service.getIssues, args, { initialNumItems: ISSUE_FEED_PAGE_SIZE, customPagination: true });
  const total = useFeedCount(api.core.issues.service.getIssueCount, args);
  const classrooms = useQuery(api.core.classrooms.service.getClassroomLookup, {});
  const classroomById = useMemo(() => new Map(classrooms?.map((classroom) => [classroom._id, classroom])), [classrooms]);

  const loadMoreIssues = useCallback(() => {
    if (status === "CanLoadMore") loadMore(ISSUE_FEED_PAGE_SIZE);
  }, [loadMore, status]);

  useEffect(() => {
    if (issues.length === 0 && status === "CanLoadMore") loadMore(ISSUE_FEED_PAGE_SIZE);
  }, [issues.length, loadMore, status]);

  const renderIssue = (issue: (typeof issues)[number]) => (
    <IssueDialog roomId={issue.classroomId} existingIssue={issue}>
      <IssueFeedCard issue={issue} classroom={classroomById.get(issue.classroomId)} className="w-full" />
    </IssueDialog>
  );
  const columns: FeedTableColumn<Doc<"issues">>[] = [
    {
      id: "classroom",
      header: "Classroom",
      width: 210,
      cell: (issue) => (
        <FeedClassroomCell classroomId={issue.classroomId} name={classroomById.get(issue.classroomId)?.displayName ?? "Unknown classroom"} />
      ),
    },
    {
      id: "description",
      header: "Issue",
      width: 240,
      grow: true,
      cell: (issue) => (
        <FeedPreviewCell value={issue.issue.description} label="Issue" author={issue.issue.reportedBy} date={issue.issue.reportedAt} />
      ),
    },
  ];
  if (!openOnly)
    columns.push({
      id: "resolution",
      header: "Resolution",
      width: 220,
      grow: true,
      cell: (issue) => (
        <FeedPreviewCell
          value={issue.resolution?.comment}
          label="Resolution"
          author={issue.resolution?.resolvedBy}
          date={issue.resolution?.resolvedAt}
        />
      ),
    });
  columns.push(
    { id: "flags", header: "Flags", width: 160, cell: (issue) => <FeedStatusIndicators {...issue.issue} /> },
    {
      id: "status",
      header: "Status",
      width: 88,
      cell: (issue) => (
        <span className={issue.resolution ? "text-emerald-400" : "text-zinc-400"}>
          {issue.resolution ? "Resolved" : issue.issue.onHold ? "On hold" : "Open"}
        </span>
      ),
    },
    { id: "reported", header: "Reported", width: 116, cell: (issue) => <FeedDateCell value={issue.issue.reportedAt} /> }
  );
  if (!openOnly)
    columns.push({ id: "resolved", header: "Resolved", width: 116, cell: (issue) => <FeedDateCell value={issue.resolution?.resolvedAt} /> });
  columns.push({ id: "reporter", header: "Reported by", width: 160, cell: (issue) => <FeedTextCell value={issue.issue.reportedBy} /> });
  const hasNextPage = status === "CanLoadMore" || status === "LoadingMore";
  const cards =
    status === "LoadingFirstPage" ? (
      <FeedLoadingState />
    ) : issues.length === 0 && !hasNextPage ? (
      <FeedEmptyState>No issues found</FeedEmptyState>
    ) : (
      <VirtualizedFeedList
        estimateSize={ISSUE_FEED_ROW_ESTIMATE_PX}
        hasNextPage={hasNextPage}
        isFetchingNextPage={status === "LoadingMore"}
        items={issues}
        onLoadMore={loadMoreIssues}
        renderItem={renderIssue}
      />
    );

  return (
    <>
      <FeedViewLayout
        view={view}
        onViewChange={onViewChange}
        total={total}
        noun="issues"
        fetchExportPage={(cursor) => convex.query(api.core.issues.service.getIssues, { ...args, paginationOpts: { cursor, numItems: 500 } })}
        filename={`issues-${openOnly ? "open" : "all"}-${new Date().toISOString().slice(0, 10)}.csv`}
        cards={cards}
        list={
          <VirtualizedFeedTable
            items={issues}
            columns={columns}
            total={total}
            label="Issues"
            loading={status === "LoadingFirstPage"}
            hasNextPage={hasNextPage}
            isFetchingNextPage={status === "LoadingMore"}
            onLoadMore={loadMoreIssues}
            onOpen={setSelectedIssue}
          />
        }
      />
      {selectedIssue && (
        <IssueDialog
          key={selectedIssue._id}
          roomId={selectedIssue.classroomId}
          existingIssue={issues.find((issue) => issue._id === selectedIssue._id) ?? selectedIssue}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedIssue(null);
          }}
        />
      )}
    </>
  );
}
