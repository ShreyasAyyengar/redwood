"use client";

import { api } from "@backend/convex/_generated/api";
import { usePaginatedQuery, useQuery } from "convex/react";
import { useCallback, useEffect } from "react";
import { FeedEmptyState, FeedLoadingState, VirtualizedFeedList } from "@/features/feed/components/feed-list-layout";
import { serializeTaskFeedFilters, type TaskFeedFilterValue } from "../../model/task-filters";
import { isTaskVisible } from "../../model/task-state";
import { TaskFeedCard } from "../cards/task-feed-card";
import { TaskDialog } from "../dialogs/task-dialog";

const TASK_FEED_ROW_ESTIMATE_PX = 180;

const TASK_FEED_PAGE_SIZE = 20;

export function TaskFeedList({ filter, openOnly }: { filter?: TaskFeedFilterValue; openOnly?: boolean }) {
  const filters = serializeTaskFeedFilters(filter);
  const {
    results: tasks,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.core.tasks.service.getTasks,
    {
      view: openOnly ? "OPEN" : "ALL",
      ...(filters ? { filters } : {}),
    },
    { initialNumItems: TASK_FEED_PAGE_SIZE }
  );
  const classrooms = useQuery(api.core.classrooms.service.getClassroomLookup, {});
  const loadMoreTasks = useCallback(() => {
    if (status === "CanLoadMore") loadMore(TASK_FEED_PAGE_SIZE);
  }, [loadMore, status]);
  const visibleTasks = tasks.filter((task) => isTaskVisible(task));

  useEffect(() => {
    if (visibleTasks.length === 0 && tasks.length > 0 && status === "CanLoadMore") loadMore(TASK_FEED_PAGE_SIZE);
  }, [loadMore, status, tasks.length, visibleTasks.length]);

  if (status === "LoadingFirstPage") return <FeedLoadingState />;

  if (visibleTasks.length === 0 && (status === "CanLoadMore" || status === "LoadingMore")) return <FeedLoadingState />;

  if (visibleTasks.length === 0 && status !== "CanLoadMore" && status !== "LoadingMore") {
    return <FeedEmptyState>No tasks found</FeedEmptyState>;
  }

  const renderTask = (task: (typeof visibleTasks)[number]) => (
    <TaskDialog roomId={task.classroomId} existingTask={task}>
      <TaskFeedCard task={task} classroom={classrooms?.find((classroom) => classroom._id === task.classroomId)} className="w-full" />
    </TaskDialog>
  );

  return (
    <VirtualizedFeedList
      estimateSize={TASK_FEED_ROW_ESTIMATE_PX}
      hasNextPage={status === "CanLoadMore" || status === "LoadingMore"}
      isFetchingNextPage={status === "LoadingMore"}
      items={visibleTasks}
      onLoadMore={loadMoreTasks}
      renderItem={renderTask}
    />
  );
}
