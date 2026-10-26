"use client";

import { api } from "@backend/convex/_generated/api";
import type { Doc } from "@backend/convex/_generated/dataModel";
import { useConvex } from "convex/react";
import { usePaginatedQuery, useQuery } from "convex-helpers/react/cache/hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FeedEmptyState, FeedLoadingState, VirtualizedFeedList } from "#/features/feed/components/feed-list-layout.tsx";
import { FeedStatusIndicators } from "#/features/feed/components/feed-status-indicators.tsx";
import { FeedClassroomCell, FeedDateCell, FeedPreviewCell, FeedTextCell } from "#/features/feed/components/feed-table-cells.tsx";
import { type FeedView, FeedViewLayout } from "#/features/feed/components/feed-view-layout.tsx";
import { type FeedTableColumn, VirtualizedFeedTable } from "#/features/feed/components/virtualized-feed-table.tsx";
import { useFeedCount } from "#/features/feed/model/use-feed-count.ts";
import { serializeTaskFeedFilters, type TaskFeedFilterValue } from "../../model/task-filters";
import { isTaskVisible } from "../../model/task-state";
import { TaskFeedCard } from "../cards/task-feed-card";
import { TaskDialog } from "../dialogs/task-dialog";

const TASK_FEED_ROW_ESTIMATE_PX = 180;

const TASK_FEED_PAGE_SIZE = 20;

export function TaskFeedList({
  filter,
  openOnly,
  view,
  onViewChange,
}: {
  filter?: TaskFeedFilterValue;
  openOnly?: boolean;
  view: FeedView;
  onViewChange: (view: FeedView) => void;
}) {
  const filters = serializeTaskFeedFilters(filter);
  const args = { view: openOnly ? ("OPEN" as const) : ("ALL" as const), ...(filters ? { filters } : {}) };
  const convex = useConvex();
  const [selectedTask, setSelectedTask] = useState<Doc<"tasks"> | null>(null);
  const {
    results: tasks,
    status,
    loadMore,
  } = usePaginatedQuery(api.core.tasks.service.getTasks, args, { initialNumItems: TASK_FEED_PAGE_SIZE, customPagination: true });
  const total = useFeedCount(api.core.tasks.service.getTaskCount, args);
  const classrooms = useQuery(api.core.classrooms.service.getClassroomLookup, {});
  const classroomById = useMemo(() => new Map(classrooms?.map((classroom) => [classroom._id, classroom])), [classrooms]);
  const loadMoreTasks = useCallback(() => {
    if (status === "CanLoadMore") loadMore(TASK_FEED_PAGE_SIZE);
  }, [loadMore, status]);
  const visibleTasks = tasks.filter((task) => isTaskVisible(task));

  useEffect(() => {
    if (visibleTasks.length === 0 && status === "CanLoadMore") loadMore(TASK_FEED_PAGE_SIZE);
  }, [loadMore, status, visibleTasks.length]);

  const renderTask = (task: (typeof visibleTasks)[number]) => (
    <TaskDialog roomId={task.classroomId} existingTask={task}>
      <TaskFeedCard task={task} classroom={classroomById.get(task.classroomId)} className="w-full" />
    </TaskDialog>
  );
  const columns: FeedTableColumn<Doc<"tasks">>[] = [
    {
      id: "classroom",
      header: "Classroom",
      width: 210,
      cell: (task) => (
        <FeedClassroomCell classroomId={task.classroomId} name={classroomById.get(task.classroomId)?.displayName ?? "Unknown classroom"} />
      ),
    },
    {
      id: "description",
      header: "Task",
      width: 240,
      grow: true,
      cell: (task) => <FeedPreviewCell value={task.task.description} label="Task" author={task.task.createdBy} date={task.task.createdAt} />,
    },
    { id: "flags", header: "Flags", width: 88, cell: (task) => <FeedStatusIndicators {...task.task} /> },
    {
      id: "status",
      header: "Status",
      width: 88,
      cell: (task) => <span className={task.completion ? "text-emerald-400" : "text-zinc-400"}>{task.completion ? "Completed" : "Open"}</span>,
    },
    { id: "created", header: "Created", width: 116, cell: (task) => <FeedDateCell value={task.task.createdAt} /> },
    { id: "creator", header: "Created by", width: 160, cell: (task) => <FeedTextCell value={task.task.createdBy} /> },
    {
      id: "due",
      header: "Due",
      width: 116,
      cell: (task) => (
        <FeedDateCell
          value={task.task.completeBy}
          overdue={!task.completion && Boolean(task.task.completeBy && Date.parse(task.task.completeBy) < Date.now())}
        />
      ),
    },
  ];
  if (!openOnly)
    columns.push({ id: "completed", header: "Completed", width: 116, cell: (task) => <FeedDateCell value={task.completion?.completedAt} /> });
  const hasNextPage = status === "CanLoadMore" || status === "LoadingMore";
  const cards =
    status === "LoadingFirstPage" || (visibleTasks.length === 0 && hasNextPage) ? (
      <FeedLoadingState />
    ) : visibleTasks.length === 0 ? (
      <FeedEmptyState>No tasks found</FeedEmptyState>
    ) : (
      <VirtualizedFeedList
        estimateSize={TASK_FEED_ROW_ESTIMATE_PX}
        hasNextPage={hasNextPage}
        isFetchingNextPage={status === "LoadingMore"}
        items={visibleTasks}
        onLoadMore={loadMoreTasks}
        renderItem={renderTask}
      />
    );

  return (
    <>
      <FeedViewLayout
        view={view}
        onViewChange={onViewChange}
        total={total}
        noun="tasks"
        fetchExportPage={(cursor) => convex.query(api.core.tasks.service.getTasks, { ...args, paginationOpts: { cursor, numItems: 500 } })}
        filename={`tasks-${openOnly ? "open" : "all"}-${new Date().toISOString().slice(0, 10)}.csv`}
        cards={cards}
        list={
          <VirtualizedFeedTable
            items={visibleTasks}
            columns={columns}
            total={total}
            label="Tasks"
            loading={status === "LoadingFirstPage"}
            hasNextPage={hasNextPage}
            isFetchingNextPage={status === "LoadingMore"}
            onLoadMore={loadMoreTasks}
            onOpen={setSelectedTask}
          />
        }
      />
      {selectedTask && (
        <TaskDialog
          key={selectedTask._id}
          roomId={selectedTask.classroomId}
          existingTask={tasks.find((task) => task._id === selectedTask._id) ?? selectedTask}
          open
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null);
          }}
        />
      )}
    </>
  );
}
