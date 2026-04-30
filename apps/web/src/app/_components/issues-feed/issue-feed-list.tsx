"use client";

import { useQuery } from "@tanstack/react-query";
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

  const { data: allIssues, isLoading: allIssuesLoading } = useQuery(
    webClientORPC.issues.getIssues.queryOptions({
      input: { direction: "NEWEST_FIRST" },
      select: (data) => data.issues,
      enabled: !openOnly,
    })
  );

  const issues = openOnly ? openIssues : allIssues;
  const isLoading = openOnly ? openIssuesLoading : allIssuesLoading;

  if (isLoading) {
    return <FeedLoadingState />;
  }

  if (!issues || issues.length === 0) {
    return <FeedEmptyState>No issues found</FeedEmptyState>;
  }

  const renderIssue = (issue: (typeof issues)[number]) => (
    <IssueDialog roomId={issue.classroomId} existingIssue={issue}>
      <IssueFeedCard issue={issue} className="w-1/2" />
    </IssueDialog>
  );

  if (openOnly) {
    return <StackedFeedList items={issues} renderItem={renderIssue} />;
  }

  return <VirtualizedFeedList estimateSize={ISSUE_FEED_ROW_ESTIMATE_PX} items={issues} renderItem={renderIssue} />;
}
