"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { webClientORPC } from "../../../lib/orpc-web-client";
import { IssueDialog } from "../../classroom/[id]/_components/issue/issue-dialog";
import type { IssueFeedFilterValue } from "../feed-filter-controls";
import { FeedEmptyState, FeedLoadingState, VirtualizedFeedList } from "../feed-list-layout";
import { IssueFeedCard } from "./issue-feed-card";

const ISSUE_FEED_ROW_ESTIMATE_PX = 220;

type IssueFeedListFilter = IssueFeedFilterValue & {
  classroomId?: string;
  group?: string;
};

export function IssueFeedList({ filter, openOnly }: { filter?: IssueFeedListFilter; openOnly?: boolean }) {
  const issuesQuery = useInfiniteQuery(
    webClientORPC.issues.getIssues.infiniteOptions({
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: undefined,
      input: (cursor) => ({
        cursor,
        direction: "NEWEST_FIRST",
        filter: openOnly ? { ...filter, status: "UNRESOLVED" } : filter,
      }),

      // it is expensive to load all issues, so keep it fresh until the browser reloads.
      gcTime: Number.POSITIVE_INFINITY,
      staleTime: Number.POSITIVE_INFINITY,
    })
  );

  const issues = useMemo(() => issuesQuery.data?.pages.flatMap((page) => page.issues) ?? [], [issuesQuery.data]);
  const loadMoreIssues = useCallback(() => {
    issuesQuery.fetchNextPage();
  }, [issuesQuery.fetchNextPage]);

  if (issuesQuery.isLoading) {
    return <FeedLoadingState />;
  }

  if (!issues || issues.length === 0) {
    return <FeedEmptyState>No issues found</FeedEmptyState>;
  }

  const renderIssue = (issue: (typeof issues)[number]) => (
    <IssueDialog roomId={issue.classroomId} existingIssue={issue}>
      <IssueFeedCard issue={issue} className="w-full" />
    </IssueDialog>
  );

  return (
    <VirtualizedFeedList
      estimateSize={ISSUE_FEED_ROW_ESTIMATE_PX}
      hasNextPage={issuesQuery.hasNextPage}
      isFetchingNextPage={issuesQuery.isFetchingNextPage}
      items={issues}
      onLoadMore={loadMoreIssues}
      renderItem={renderIssue}
    />
  );
}
