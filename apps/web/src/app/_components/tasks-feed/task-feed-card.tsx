import type { taskSchema } from "@redwood/contracts";
import { Badge } from "@redwood/shad-ui/components/badge";
import { Card } from "@redwood/shad-ui/components/card";
import { cn } from "@redwood/shad-ui/lib/utils";
import { Calendar, CheckCircle2, ClipboardList, Clock3, Eye, MessageSquare, User, UserCheck } from "lucide-react";
import { forwardRef } from "react";
import type { z } from "zod";
import { getDateTimeDisplay } from "../../../util/date-time-utils";
import { urgencyStyle } from "../../../util/style-util";
import { FeedMetaPill } from "../feed-meta-pill";
import { useFetchedRoomsStore } from "../room-store";

export const TaskFeedCard = forwardRef<HTMLDivElement, { task: z.infer<typeof taskSchema> } & React.HTMLAttributes<HTMLDivElement>>(
  ({ task, className, ...props }, ref) => {
    const { fetchedRooms } = useFetchedRoomsStore();
    const room = fetchedRooms.find((r) => r._id === task.classroomId);

    const reportedDateDisplay = getDateTimeDisplay(task.task.createdAt);
    const completionDateDisplay = task.completion && getDateTimeDisplay(task.completion.completedAt);
    const visibleDateDisplay = task.task.visibleAt && getDateTimeDisplay(task.task.visibleAt);
    const completeByDateDisplay = task.task.completeBy && getDateTimeDisplay(task.task.completeBy);

    const isOverdue = !task.completion && task.task.completeBy && Date.now() > new Date(task.task.completeBy).getTime();
    const isVisible = !task.task.visibleAt || new Date(task.task.visibleAt).getTime() <= Date.now();

    return (
      <Card
        ref={ref}
        className={cn(
          "flex w-full flex-col gap-4 border-zinc-800/80 bg-zinc-900/50 p-4 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/70 active:scale-[0.99]",
          className
        )}
        {...props}
      >
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div
              className={cn(
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
                task.task.urgent ? "border-red-500/20 bg-red-500/10" : "border-amber-500/20 bg-amber-500/10"
              )}
            >
              <ClipboardList className={cn("size-6", task.task.urgent ? "text-red-400" : "text-amber-400")} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2">
                <span className="font-bold text-lg text-zinc-100 leading-tight">{room ? room.displayName : "Unknown Room"}</span>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="h-6 border-zinc-800 bg-zinc-950/70 px-2 text-[10px] text-zinc-300">
                    {task.completion ? "Completed task" : !isVisible ? "Scheduled task" : "Active task"}
                  </Badge>
                  {task.task.urgent && (
                    <Badge variant="outline" className={cn("h-6 px-2 text-[10px]", urgencyStyle("red"))}>
                      Urgent
                    </Badge>
                  )}
                  {isOverdue && (
                    <Badge variant="outline" className={cn("h-6 px-2 text-[10px]", urgencyStyle("orange"))}>
                      Overdue
                    </Badge>
                  )}
                  {!isVisible && !task.completion && (
                    <Badge variant="outline" className="h-6 border-zinc-700 bg-zinc-800/80 px-2 text-[10px] text-zinc-400">
                      Hidden until visible
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <FeedMetaPill
                  icon={Clock3}
                  label="Created"
                  value={reportedDateDisplay.dateDaysAgo}
                  tooltip={`Created: ${reportedDateDisplay.dateAbsolute}`}
                  tone="accent"
                />
                {completeByDateDisplay && (
                  <FeedMetaPill
                    icon={Calendar}
                    label="Due"
                    value={completeByDateDisplay.dateDaysAgo}
                    tooltip={`Due: ${completeByDateDisplay.dateAbsolute}`}
                    tone={isOverdue ? "danger" : "default"}
                  />
                )}
                {task.completion && completionDateDisplay && (
                  <FeedMetaPill
                    icon={CheckCircle2}
                    label="Completed"
                    value={completionDateDisplay.dateDaysAgo}
                    tooltip={`Completed: ${completionDateDisplay.dateAbsolute}`}
                    tone="success"
                  />
                )}
                {!isVisible && !task.completion && visibleDateDisplay && (
                  <FeedMetaPill
                    icon={Eye}
                    label="Visible"
                    value={visibleDateDisplay.dateDaysAgo.replace("-", "")}
                    tooltip={`Visible: ${visibleDateDisplay.dateAbsolute}`}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="grid w-full min-w-0 grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-3">
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.18em]">Created By</span>
              <p className="mt-1 truncate font-medium text-sm text-zinc-200">{task.task.createdBy}</p>
            </div>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-3">
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.18em]">State</span>
              <p
                className={cn("mt-1 font-medium text-sm", task.completion ? "text-emerald-300" : isOverdue ? "text-amber-300" : "text-zinc-200")}
              >
                {task.completion ? "Closed out" : isOverdue ? "Past due" : !isVisible ? "Queued" : "In progress"}
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/70 to-transparent" />
          <p className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed">{task.task.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/30 p-3 text-xs text-zinc-400">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800/80">
              <User className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-[10px] text-zinc-500 uppercase tracking-[0.18em]">Owner</span>
              <span className="text-sm text-zinc-300">{task.task.createdBy}</span>
            </div>
          </div>

          {task.completion && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-3 text-xs text-zinc-400">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <UserCheck className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-[10px] text-emerald-500/70 uppercase tracking-[0.18em]">Completed By</span>
                <span className="text-sm text-zinc-300">{task.completion.completedBy}</span>
              </div>
            </div>
          )}
        </div>

        {task.completion?.comment && (
          <div className="mt-1 flex items-start gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-3">
            <MessageSquare className="mt-0.5 size-4 text-emerald-500/50" />
            <div className="flex flex-col">
              <span className="font-bold text-[10px] text-emerald-500/70 uppercase tracking-[0.18em]">Completion Note</span>
              <p className="text-emerald-200/90 text-sm">{task.completion.comment}</p>
            </div>
          </div>
        )}
      </Card>
    );
  }
);
