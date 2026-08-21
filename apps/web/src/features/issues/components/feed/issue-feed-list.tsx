"use client";

import { api } from "@backend/convex/_generated/api";
import { usePaginatedQuery, useQuery } from "convex/react";
import { useCallback } from "react";
import { FeedEmptyState, FeedLoadingState, VirtualizedFeedList } from "#/features/feed/components/feed-list-layout.tsx";
import { type IssueFeedFilterValue, toIssueFeedFilters } from "../../model/issue-filters";
import { IssueFeedCard } from "../cards/issue-feed-card";
import { IssueDialog } from "../dialogs/issue-dialog";

const ISSUE_FEED_ROW_ESTIMATE_PX = 220;
const ISSUE_FEED_PAGE_SIZE = 20;

export function IssueFeedList({ filter, openOnly }: { filter?: IssueFeedFilterValue; openOnly?: boolean }) {
  const filters = toIssueFeedFilters(filter);

  const {
    results: issues,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.core.issues.service.getIssues,
    {
      view: openOnly ? "ACTIVE" : "ALL",
      ...(filters ? { filters } : {}),
    },
    { initialNumItems: ISSUE_FEED_PAGE_SIZE }
  );
  const classrooms = useQuery(api.core.classrooms.service.getClassroomLookup, {});

  const loadMoreIssues = useCallback(() => {
    if (status === "CanLoadMore") loadMore(ISSUE_FEED_PAGE_SIZE);
  }, [loadMore, status]);

  if (status === "LoadingFirstPage") {
    return <FeedLoadingState />;
  }

  if (!issues || issues.length === 0) {
    return <FeedEmptyState>No issues found</FeedEmptyState>;
  }

  const renderIssue = (issue: (typeof issues)[number]) => (
    <IssueDialog roomId={issue.classroomId} existingIssue={issue}>
      <IssueFeedCard issue={issue} classroom={classrooms?.find((classroom) => classroom._id === issue.classroomId)} className="w-full" />
    </IssueDialog>
  );

  return (
    // TODO remove `estimateSize` prop
    <VirtualizedFeedList
      estimateSize={ISSUE_FEED_ROW_ESTIMATE_PX}
      hasNextPage={status === "CanLoadMore" || status === "LoadingMore"}
      isFetchingNextPage={status === "LoadingMore"}
      items={issues}
      onLoadMore={loadMoreIssues}
      renderItem={renderIssue}
    />
  );
}
