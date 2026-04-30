import { useInfiniteQuery } from "@tanstack/react-query";
import type React from "react";
import { useMemo, useState } from "react";
import { webClientORPC } from "../../../../../lib/orpc-web-client";
import { IssueListDialog } from "./issue-list-dialog";

export function ClassroomIssueHistoryDialog({
  children,
  classroomId,
  title,
}: {
  children?: React.ReactNode;
  classroomId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);

  const issueHistoryQuery = useInfiniteQuery(
    webClientORPC.issues.getIssues.infiniteOptions({
      enabled: open,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: undefined,
      input: (cursor) => ({
        classroomId,
        cursor,
        direction: "NEWEST_FIRST",
      }),
    })
  );

  const issues = useMemo(() => issueHistoryQuery.data?.pages.flatMap((page) => page.issues) ?? [], [issueHistoryQuery.data]);

  return (
    <IssueListDialog
      emptyMessage="No issue history found"
      hasMore={issueHistoryQuery.hasNextPage}
      isFetchingMore={issueHistoryQuery.isFetchingNextPage}
      isLoading={issueHistoryQuery.isLoading}
      onLoadMore={() => issueHistoryQuery.fetchNextPage()}
      onOpenChange={setOpen}
      open={open}
      issues={issues}
      title={title}
    >
      {children}
    </IssueListDialog>
  );
}
