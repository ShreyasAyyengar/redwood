"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { webClientORPC } from "../../../lib/orpc-web-client";
import { IssueDialog } from "../../classroom/[id]/_components/issue/issue-dialog";
import { FeedEmptyState, FeedLoadingState, StackedFeedList, VirtualizedFeedList } from "../feed-list-layout";
import type { FeedRoomFilterValue } from "../feed-room-filter";
import { useFetchedRoomsStore } from "../room-store";
import { IssueFeedCard } from "./issue-feed-card";

const ISSUE_FEED_ROW_ESTIMATE_PX = 220;

export function IssueFeedList({ filter, openOnly }: { filter?: FeedRoomFilterValue; openOnly?: boolean }) {
  const { fetchedRooms } = useFetchedRoomsStore();

  const { data: openIssues, isLoading: openIssuesLoading } = useQuery(
    webClientORPC.issues.getActiveIssues.queryOptions({
      enabled: !!openOnly,
      input: filter?.classroomId ? { classroomId: filter.classroomId } : undefined,
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
        filter,
      }),

      // it is expensive to load all issues, so keep it fresh until the browser reloads.
      gcTime: Number.POSITIVE_INFINITY,
      staleTime: Number.POSITIVE_INFINITY,
    })
  );

  const allIssues = useMemo(() => allIssuesQuery.data?.pages.flatMap((page) => page.issues) ?? [], [allIssuesQuery.data]);
  const filteredOpenIssues = useMemo(() => {
    if (!openIssues || !filter?.group || filter.classroomId) return openIssues;

    const roomIds = new Set(fetchedRooms.filter((room) => room.groupKey === filter.group).map((room) => room._id));
    return openIssues.filter((issue) => roomIds.has(issue.classroomId));
  }, [fetchedRooms, filter?.classroomId, filter?.group, openIssues]);
  const issues = openOnly ? filteredOpenIssues : allIssues;
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
