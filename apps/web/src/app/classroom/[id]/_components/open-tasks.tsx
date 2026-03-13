import type { classroomSchema, taskSchema } from "@redwood/contracts";
import { Badge } from "@redwood/shad-ui/components/badge";
import { Card } from "@redwood/shad-ui/components/card";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { cn } from "@redwood/shad-ui/lib/utils";
import { AlertCircle, AlertTriangle, BookAlert, CircleAlert, Plus } from "lucide-react";
import type { z } from "zod";
import { daysAgo as daysAgoUtil } from "../../../../util/date-time-utils";
import { urgencyStyle } from "../../../../util/style-util";
import { NewTaskDialog } from "./new-task-dialog";

export default function OpenTasks({ tasks, roomId }: { tasks?: z.infer<typeof taskSchema>[]; roomId: z.infer<typeof classroomSchema>["_id"] }) {
  const now = Date.now();
  const openTasks = tasks?.filter((task) => !task.completion && (!task.task.visibleAt || new Date(task.task.visibleAt).getTime() <= now));

  return (
    <div className="group relative flex h-full flex-1">
      {/* gradient blur background */}
      {openTasks && openTasks.filter((task) => task.task.urgent).length > 0 && (
        <div className="absolute inset-0 flex h-full flex-1 scale-102 rounded-2xl bg-blue-800 opacity-50 blur-md transition duration-1000 group-hover:opacity-75 group-hover:duration-200" />
      )}

      <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden rounded-2xl bg-zinc-900 p-5 font-bold text-xl text-zinc-300/80 shadow-xl/50 sm:text-2xl">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <CircleAlert className="h-6 w-6 text-blue-500" />
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

            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-3 font-normal transition-colors hover:text-neutral-200 sm:text-lg"
            >
              <BookAlert className="h-5 w-5" />
              <span className="font-normal text-md">See Task History</span>
              {/* TODO open dialog */}
            </button>
          </div>
          <NewTaskDialog roomId={roomId}>
            <div className="flex w-fit items-center rounded-md bg-neutral-300 px-2 py-1 text-center font-semibold text-black text-lg transition-all duration-150 hover:bg-neutral-400 active:scale-95 active:transform">
              <Plus className="mr-2 h-5 w-5" />
              New Task
            </div>
          </NewTaskDialog>
        </div>

        {openTasks && openTasks.length > 0 ? (
          <ScrollArea className="mt-5 h-full min-h-0 flex-1 overflow-auto rounded-2xl bg-zinc-950/50 p-3">
            {openTasks?.map((task) => {
              const isOverdue = task.task.completeBy && Date.now() > new Date(task.task.completeBy).getTime();
              const daysAgo = daysAgoUtil(task.task.createdAt);
              const daysAgoStr = daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`; // TODO apply this in more places?

              return (
                <Card key={task._id} className="mt-1 border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {task.task.urgent ? (
                        <AlertTriangle className="size-5 text-red-400" />
                      ) : (
                        <AlertCircle className={cn("size-5", isOverdue ? "text-amber-400" : "text-zinc-400")} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <p className="flex-1 font-normal text-sm text-zinc-200">{task.task.description}</p>
                        <div className="flex shrink-0 gap-1.5">
                          {task.task.urgent && (
                            <Badge variant="outline" className="border-red-500/30 bg-red-500/20 text-red-400">
                              Urgent
                            </Badge>
                          )}
                          {/* TODO use this box for overdue tasks */}
                          {isOverdue && (
                            <Badge variant="outline" className={urgencyStyle("orange")}>
                              Overdue
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <span>Created {daysAgoStr}</span>
                        <span className="text-zinc-700">•</span>
                        <span>by {task.task.createdBy.split("@")[0]}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
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
