"use client";

import { useQuery } from "@tanstack/react-query";
import { webClientORPC } from "../../../lib/orpc-web-client";
import { TaskDialog } from "../../classroom/[id]/_components/task/task-dialog";
import { FeedEmptyState, FeedLoadingState, StackedFeedList, VirtualizedFeedList } from "../feed-list-layout";
import { TaskFeedCard } from "./task-feed-card";

const TASK_FEED_ROW_ESTIMATE_PX = 180;

export function TaskFeedList({ openOnly }: { openOnly?: boolean }) {
  const { data: openTasks, isLoading: openTasksLoading } = useQuery(
    webClientORPC.tasks.getOpenTasks.queryOptions({
      enabled: !!openOnly,
    })
  );

  const { data: allTasks, isLoading: allTasksLoading } = useQuery(
    webClientORPC.tasks.getTasks.queryOptions({
      input: { direction: "NEWEST_FIRST" },
      select: (data) => data.tasks,
      enabled: !openOnly,
    })
  );

  const tasks = openOnly ? openTasks : allTasks;
  const isLoading = openOnly ? openTasksLoading : allTasksLoading;

  if (isLoading) {
    return <FeedLoadingState />;
  }

  if (!tasks || tasks.length === 0) {
    return <FeedEmptyState>No tasks found</FeedEmptyState>;
  }

  const renderTask = (task: (typeof tasks)[number]) => (
    <TaskDialog roomId={task.classroomId} existingTask={task}>
      <TaskFeedCard task={task} className="w-full" />
    </TaskDialog>
  );

  if (openOnly) {
    return <StackedFeedList items={tasks} renderItem={renderTask} />;
  }

  return <VirtualizedFeedList estimateSize={TASK_FEED_ROW_ESTIMATE_PX} items={tasks} renderItem={renderTask} />;
}
