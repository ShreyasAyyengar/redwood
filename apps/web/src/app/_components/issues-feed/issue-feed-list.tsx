"use client";

import { useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2 } from "lucide-react";
import { useRef } from "react";
import { webClientORPC } from "../../../lib/orpc-web-client";
import { IssueDialog } from "../../classroom/[id]/_components/issue/issue-dialog";
import { IssueFeedCard } from "./issue-feed-card";

const ISSUE_FEED_ROW_ESTIMATE_PX = 220;

export function IssueFeedList({ openOnly }: { openOnly?: boolean }) {
  const { data: openIssues, isLoading: openIssuesLoading } = useQuery(
    webClientORPC.issues.getActiveTasks.queryOptions({
      input: {},
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

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: openOnly ? 0 : (issues?.length ?? 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => ISSUE_FEED_ROW_ESTIMATE_PX,
    overscan: 2,
    getItemKey: (index) => issues?.[index]?._id ?? index,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!issues || issues.length === 0) {
    return <div className="flex h-full items-center justify-center text-zinc-500">No issues found</div>;
  }

  if (openOnly) {
    return (
      <div className="flex h-full w-full min-w-0 flex-col gap-2 overflow-y-auto p-4">
        {issues.map((issue) => (
          <IssueDialog key={issue._id} roomId={issue.classroomId} existingIssue={issue}>
            <IssueFeedCard issue={issue} />
          </IssueDialog>
        ))}
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-full w-full min-w-0 overflow-y-auto p-4">
      <div
        className="relative w-full min-w-0"
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const issue = issues[virtualRow.index];
          if (!issue) return null;

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="absolute top-0 left-0 w-full min-w-0"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: "8px",
              }}
            >
              <IssueDialog roomId={issue.classroomId} existingIssue={issue}>
                <IssueFeedCard issue={issue} className="w-full" />
              </IssueDialog>
            </div>
          );
        })}
      </div>
    </div>
  );
}
