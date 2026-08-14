import { api } from "@backend/convex/_generated/api";
import { Button } from "@redwood/shad-ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@redwood/shad-ui/components/popover";
import { cn } from "@redwood/shad-ui/lib/utils";
import type { LegacyRow as Row } from "@tanstack/react-table/legacy";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { MiniTaskCard } from "@/features/tasks/components/cards/task-card";
import { TaskDialog } from "@/features/tasks/components/dialogs/task-dialog";
import { isOpenTask, sortOpenTasks } from "@/features/tasks/model/task-state";
import type { ClassroomSummary } from "../../../model/classroom-types";

export default function OpenTasksCell({ row }: { row: Row<ClassroomSummary> }) {
  const room = row.original;
  const openTasksCount = room.openTasksCount;
  const [isHoverOpen, setIsHoverOpen] = useState(false);

  const tasks = useQuery(api.core.tasks.service.getClassroomTasks, isHoverOpen ? { classroomId: room._id } : "skip");
  const visibleOpenTasks = tasks ? sortOpenTasks(tasks.filter((task) => isOpenTask(task))) : undefined;

  return (
    <Popover open={isHoverOpen} onOpenChange={setIsHoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "clear! mx-auto flex h-12 w-12 items-center justify-center rounded-lg font-bold text-4xl transition-all duration-150",
            "hover:bg-zinc-900! active:scale-90 active:transform",
            openTasksCount > 0 ? "text-amber-400" : "text-foreground"
          )}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
        >
          {openTasksCount}
        </Button>
      </PopoverTrigger>

      <PopoverContent
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

        {tasks === undefined ? (
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
      </PopoverContent>
    </Popover>
  );
}
