"use client";

import { useQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2 } from "lucide-react";
import { useRef } from "react";
import { webClientORPC } from "../../../lib/orpc-web-client";
import { TaskDialog } from "../../classroom/[id]/_components/task/task-dialog";
import { TaskFeedCard } from "./task-feed-card";

export function TaskFeedList({ openOnly }: { openOnly?: boolean }) {
  // TODO replace with inf query

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

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: openOnly ? 0 : (tasks?.length ?? 0),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 180,
    overscan: 2,
    getItemKey: (index) => tasks?.[index]?._id ?? index,
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return <div className="flex h-full items-center justify-center text-zinc-500">No tasks found</div>;
  }

  if (openOnly) {
    return (
      <div className="flex h-full w-full min-w-0 flex-col gap-2 overflow-y-auto p-4">
        {tasks.map((task) => (
          <TaskDialog key={task._id} roomId={task.classroomId} existingTask={task}>
            <TaskFeedCard task={task} />
          </TaskDialog>
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
          const task = tasks[virtualRow.index];
          if (!task) return null;

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              className="absolute top-0 left-0 w-full min-w-0"
              style={{
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: "8px",
              }}
              ref={rowVirtualizer.measureElement}
            >
              <TaskDialog roomId={task.classroomId} existingTask={task}>
                <TaskFeedCard task={task} className="w-full" />
              </TaskDialog>
            </div>
          );
        })}
      </div>
    </div>
  );
}
