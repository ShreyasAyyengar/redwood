import { useInfiniteQuery } from "@tanstack/react-query";
import type React from "react";
import { useMemo, useState } from "react";
import { webClientORPC } from "../../../../../lib/orpc-web-client";
import { TaskListDialog } from "./task-list-dialog";

export function ClassroomTaskHistoryDialog({
  children,
  classroomId,
  title,
}: {
  children?: React.ReactNode;
  classroomId: string;
  title: string;
}) {
  const [open, setOpen] = useState(false);

  const taskHistoryQuery = useInfiniteQuery(
    webClientORPC.tasks.getTasks.infiniteOptions({
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

  const tasks = useMemo(() => taskHistoryQuery.data?.pages.flatMap((page) => page.tasks) ?? [], [taskHistoryQuery.data]);

  return (
    <TaskListDialog
      emptyMessage="No task history found"
      hasMore={taskHistoryQuery.hasNextPage}
      isFetchingMore={taskHistoryQuery.isFetchingNextPage}
      isLoading={taskHistoryQuery.isLoading}
      onLoadMore={() => taskHistoryQuery.fetchNextPage()}
      onOpenChange={setOpen}
      open={open}
      tasks={tasks}
      title={title}
    >
      {children}
    </TaskListDialog>
  );
}
