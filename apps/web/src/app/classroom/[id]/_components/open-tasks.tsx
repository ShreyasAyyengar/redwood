import type { classroomSchema, taskSchema } from "@redwood/contracts";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { cn } from "@redwood/shad-ui/lib/utils";
import { BookAlert, ClipboardList, Plus } from "lucide-react";
import type { z } from "zod";
import { TaskCard, TaskCardSkeleton } from "./task/task-card";
import { TaskDialog } from "./task/task-dialog";
import TaskHistoryDialog from "./task/task-history-dialog";

export default function OpenTasks({ tasks, room }: { tasks?: z.infer<typeof taskSchema>[]; room: z.infer<typeof classroomSchema> }) {
  const now = Date.now();
  const openTasks = tasks?.filter((task) => !task.completion && (!task.task.visibleAt || new Date(task.task.visibleAt).getTime() <= now));

  return (
    <div className="group relative flex h-full flex-1">
      {/* gradient blur background */}
      {openTasks && openTasks.filter((task) => task.task.urgent).length > 0 && (
        <div className="absolute inset-0 flex h-full flex-1 scale-102 rounded-2xl bg-blue-800 opacity-50 blur-md transition duration-1000 group-hover:opacity-75 group-hover:duration-200" />
      )}

      <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden rounded-2xl bg-neutral-900/95 p-5 font-bold text-xl text-zinc-300/80 shadow-xl/50 sm:text-2xl">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-blue-500" />
              <div>Open Tasks</div>
              {openTasks && (
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-sm transition-all duration-100",
                    openTasks.length > 0
                      ? "border-blue-500/30 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                      : "border-zinc-500/30 bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30"
                  )}
                >
                  {openTasks.length}
                </span>
              )}
            </div>

            <TaskHistoryDialog title={`Task History: ${room.displayName}`} tasks={tasks}>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-3 font-normal transition-colors hover:text-neutral-200 sm:text-lg"
              >
                <BookAlert className="h-5 w-5" />
                <span className="font-normal text-md">See Task History</span>
              </button>
            </TaskHistoryDialog>
          </div>
          <TaskDialog roomId={room._id}>
            <div className="flex w-fit items-center rounded-md bg-neutral-300 px-2 py-1 text-center font-semibold text-black text-lg transition-all duration-150 hover:bg-neutral-400 active:scale-95 active:transform">
              <Plus className="mr-2 h-5 w-5" />
              New Task
            </div>
          </TaskDialog>
        </div>

        {openTasks && openTasks.length > 0 ? (
          <ScrollArea className="mt-5 h-full min-h-0 flex-1 overflow-auto rounded-2xl bg-zinc-950/50 p-3">
            {openTasks?.map((task) => (
              <TaskDialog key={task._id} roomId={room._id} existingTask={task}>
                <TaskCard task={task} />
              </TaskDialog>
            ))}
          </ScrollArea>
        ) : (
          <div className="flex flex-1 items-center justify-center font-semibold text-3xl text-zinc-300">
            <span className="rounded-md bg-zinc-950/85 p-5">No Open Tasks!</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function OpenTasksSkeleton() {
  return (
    <div className="group relative flex h-full flex-1">
      <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden rounded-2xl bg-zinc-900 p-5 font-bold text-xl text-zinc-300/80 shadow-xl/50 sm:text-2xl">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-blue-500" />
              <div>Open Tasks</div>

              {/* task count */}
              <span className="flex h-6 w-6 animate-pulse rounded-full bg-zinc-700/50" />
            </div>

            <button type="button" disabled className="flex w-full items-center gap-3 font-normal text-zinc-300/80 sm:text-lg">
              <BookAlert className="h-5 w-5" />
              <span className="font-normal text-md">See Task History</span>
            </button>
          </div>

          <div className="flex w-fit items-center rounded-md bg-neutral-300 px-2 py-1 text-center font-semibold text-black text-lg">
            <Plus className="mr-2 h-5 w-5" />
            New Task
          </div>
        </div>

        <ScrollArea className="mt-5 h-full min-h-0 flex-1 overflow-auto rounded-2xl bg-zinc-950/50 p-3">
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <TaskCardSkeleton key={index} />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
