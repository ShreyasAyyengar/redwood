"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { webClientORPC } from "../../../lib/orpc-web-client";
import { TaskDialog } from "../../classroom/[id]/_components/task/task-dialog";
import { FeedEmptyState, FeedLoadingState, StackedFeedList, VirtualizedFeedList } from "../feed-list-layout";
import type { FeedRoomFilterValue } from "../feed-room-filter";
import { useFetchedRoomsStore } from "../room-store";
import { TaskFeedCard } from "./task-feed-card";

const TASK_FEED_ROW_ESTIMATE_PX = 180;

export function TaskFeedList({ filter, openOnly }: { filter?: FeedRoomFilterValue; openOnly?: boolean }) {
  const { fetchedRooms } = useFetchedRoomsStore();

  const { data: openTasks, isLoading: openTasksLoading } = useQuery(
    webClientORPC.tasks.getOpenTasks.queryOptions({
      enabled: !!openOnly,
      input: filter?.classroomId ? { classroomId: filter.classroomId } : undefined,
    })
  );

  const allTasksQuery = useInfiniteQuery(
    webClientORPC.tasks.getTasks.infiniteOptions({
      enabled: !openOnly,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      initialPageParam: undefined,
      input: (cursor) => ({
        cursor,
        direction: "NEWEST_FIRST",
        filter,
      }),

      // it is expensive to load all tasks, so keep it fresh until the browser reloads.
      gcTime: Number.POSITIVE_INFINITY,
      staleTime: Number.POSITIVE_INFINITY,
    })
  );

  const allTasks = useMemo(() => allTasksQuery.data?.pages.flatMap((page) => page.tasks) ?? [], [allTasksQuery.data]);
  const filteredOpenTasks = useMemo(() => {
    if (!openTasks || !filter?.group || filter.classroomId) return openTasks;

    const roomIds = new Set(fetchedRooms.filter((room) => room.groupKey === filter.group).map((room) => room._id));
    return openTasks.filter((task) => roomIds.has(task.classroomId));
  }, [fetchedRooms, filter?.classroomId, filter?.group, openTasks]);
  const tasks = (openOnly ? filteredOpenTasks : allTasks)?.filter(
    (task) => !task.task.visibleAt || new Date(task.task.visibleAt).getTime() <= Date.now()
  );
  const isLoading = openOnly ? openTasksLoading : allTasksQuery.isLoading;
  const loadMoreTasks = useCallback(() => {
    allTasksQuery.fetchNextPage();
  }, [allTasksQuery.fetchNextPage]);

  if (isLoading) return <FeedLoadingState />;

  if (!tasks || tasks.length === 0) return <FeedEmptyState>No tasks found</FeedEmptyState>;

  const renderTask = (task: (typeof tasks)[number]) => (
    <TaskDialog roomId={task.classroomId} existingTask={task}>
      <TaskFeedCard task={task} className="w-full" />
    </TaskDialog>
  );

  if (openOnly) return <StackedFeedList items={tasks} renderItem={renderTask} />;

  return (
    <VirtualizedFeedList
      estimateSize={TASK_FEED_ROW_ESTIMATE_PX}
      hasNextPage={allTasksQuery.hasNextPage}
      isFetchingNextPage={allTasksQuery.isFetchingNextPage}
      items={tasks}
      onLoadMore={loadMoreTasks}
      renderItem={renderTask}
    />
  );
}
