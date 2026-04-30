"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { webClientORPC } from "../../../lib/orpc-web-client";
import { IssueDialog } from "../../classroom/[id]/_components/issue/issue-dialog";
import { FeedEmptyState, FeedLoadingState, StackedFeedList, VirtualizedFeedList } from "../feed-list-layout";
import { IssueFeedCard } from "./issue-feed-card";

const ISSUE_FEED_ROW_ESTIMATE_PX = 220;

export function IssueFeedList({ openOnly }: { openOnly?: boolean }) {
  const { data: openIssues, isLoading: openIssuesLoading } = useQuery(
    webClientORPC.issues.getActiveIssues.queryOptions({
      enabled: !!openOnly,
    })
  );

  const allIssuesQuery = useInfiniteQuery(
    webClientORPC.issues.getIssues.infiniteOptions({
      enabled: !openOnly,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: undefined,
      input: (cursor) => ({
        cursor,
        direction: "NEWEST_FIRST",
      }),

      // it is expensive to load all issues, so keep it fresh until the browser reloads.
      gcTime: Number.POSITIVE_INFINITY,
      staleTime: Number.POSITIVE_INFINITY,
    })
  );

  const allIssues = useMemo(() => allIssuesQuery.data?.pages.flatMap((page) => page.issues) ?? [], [allIssuesQuery.data]);
  const issues = openOnly ? openIssues : allIssues;
  const isLoading = openOnly ? openIssuesLoading : allIssuesQuery.isLoading;
  const loadMoreIssues = useCallback(() => {
    allIssuesQuery.fetchNextPage();
  }, [allIssuesQuery.fetchNextPage]);

  if (isLoading) {
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

  if (openOnly) {
    return <StackedFeedList items={issues} renderItem={renderIssue} />;
  }

  return (
    <VirtualizedFeedList
      estimateSize={ISSUE_FEED_ROW_ESTIMATE_PX}
      hasNextPage={allIssuesQuery.hasNextPage}
      isFetchingNextPage={allIssuesQuery.isFetchingNextPage}
      items={issues}
      onLoadMore={loadMoreIssues}
      renderItem={renderIssue}
    />
  );
}
