"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { webClientORPC } from "../../../lib/orpc-web-client";
import { TaskDialog } from "../../classroom/[id]/_components/task/task-dialog";
import type { TaskFeedFilterValue } from "../feed-filter-controls";
import { FeedEmptyState, FeedLoadingState, VirtualizedFeedList } from "../feed-list-layout";
import { TaskFeedCard } from "./task-feed-card";

const TASK_FEED_ROW_ESTIMATE_PX = 180;

type TaskFeedListFilter = TaskFeedFilterValue & {
  classroomId?: string;
  group?: string;
};

export function TaskFeedList({ filter, openOnly }: { filter?: TaskFeedListFilter; openOnly?: boolean }) {
  const tasksQuery = useInfiniteQuery(
    webClientORPC.tasks.getTasks.infiniteOptions({
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: undefined,
      input: (cursor) => ({
        cursor,
        direction: "NEWEST_FIRST",
        filter: openOnly ? { ...filter, status: "OPEN" } : filter,
      }),

      // it is expensive to load all tasks, so keep it fresh until the browser reloads.
      gcTime: Number.POSITIVE_INFINITY,
      staleTime: Number.POSITIVE_INFINITY,
    })
  );

  const tasks = useMemo(
    () =>
      (tasksQuery.data?.pages.flatMap((page) => page.tasks) ?? []).filter(
        (task) => !task.task.visibleAt || new Date(task.task.visibleAt).getTime() <= Date.now()
      ),
    [tasksQuery.data]
  );
  const loadMoreTasks = useCallback(() => {
    tasksQuery.fetchNextPage();
  }, [tasksQuery.fetchNextPage]);

  if (tasksQuery.isLoading) return <FeedLoadingState />;

  if (!tasks || tasks.length === 0) return <FeedEmptyState>No tasks found</FeedEmptyState>;

  const renderTask = (task: (typeof tasks)[number]) => (
    <TaskDialog roomId={task.classroomId} existingTask={task}>
      <TaskFeedCard task={task} className="w-full" />
    </TaskDialog>
  );

  return (
    <VirtualizedFeedList
      estimateSize={TASK_FEED_ROW_ESTIMATE_PX}
      hasNextPage={tasksQuery.hasNextPage}
      isFetchingNextPage={tasksQuery.isFetchingNextPage}
      items={tasks}
      onLoadMore={loadMoreTasks}
      renderItem={renderTask}
    />
  );
}
