import type { classroomSchemaPayload } from "@redwood/contracts";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@redwood/shad-ui/components/hover-card";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { Row } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../../lib/orpc-web-client";
import { MiniTaskCard } from "../../../classroom/[id]/_components/task/task-card";
import { TaskDialog } from "../../../classroom/[id]/_components/task/task-dialog";

export default function OpenTasksCell({ row }: { row: Row<z.infer<typeof classroomSchemaPayload>> }) {
  const room = row.original;
  const openTasksCount = room.openTasksCount;
  const [isHoverOpen, setIsHoverOpen] = useState(false);

  const { data: tasks, isLoading } = useQuery({
    ...webClientORPC.tasks.getOpenTasks.queryOptions({
      input: { classroomId: room._id },
    }),
    enabled: isHoverOpen,
  });

  const now = Date.now();
  const visibleOpenTasks = tasks
    ?.filter((task) => !task.completion && (!task.task.visibleAt || new Date(task.task.visibleAt).getTime() <= now))
    .sort((a, b) => Number(b.task.urgent) - Number(a.task.urgent) || a.task.createdAt.getTime() - b.task.createdAt.getTime());

  return (
    <HoverCard open={isHoverOpen} onOpenChange={setIsHoverOpen} openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div className={cn("flex items-center justify-center font-bold text-4xl text-foreground", openTasksCount > 0 && "text-amber-400")}>
          {openTasksCount}
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        className="flex w-80 flex-col items-stretch gap-2 border-zinc-800 bg-zinc-900 p-3"
        onClick={(e) => {
          e.stopPropagation();
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-center font-bold text-sm text-zinc-100">Open Tasks</span>
          <TaskDialog roomId={room._id}>
            <div className="rounded-md bg-white px-1 text-black transition-all duration-100 active:scale-95 active:transform">
              <Plus className="size-5" />
            </div>
          </TaskDialog>
        </div>
        {isLoading ? (
          <span className="py-2 text-center text-sm text-zinc-500">Loading tasks...</span>
        ) : visibleOpenTasks && visibleOpenTasks.length > 0 ? (
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {visibleOpenTasks.map((task) => (
              <TaskDialog key={task._id} roomId={room._id} existingTask={task}>
                <MiniTaskCard task={task} />
              </TaskDialog>
            ))}
          </div>
        ) : (
          <span className="py-2 text-center text-sm text-zinc-500">No open tasks</span>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}
