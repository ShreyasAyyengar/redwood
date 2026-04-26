import type { taskSchema } from "@redwood/contracts";
import { Badge } from "@redwood/shad-ui/components/badge";
import { Card } from "@redwood/shad-ui/components/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@redwood/shad-ui/components/tooltip";
import { cn } from "@redwood/shad-ui/lib/utils";
import { Check, ClipboardClock, ClipboardList, Flag, UserPen } from "lucide-react";
import type React from "react";
import { forwardRef } from "react";
import type { z } from "zod";
import { type DateTimeDisplay, daysAgoRelative as daysAgoUtil, getDateTimeDisplay } from "../../../../../util/date-time-utils";
import { urgencyStyle } from "../../../../../util/style-util";

export const TaskCard = forwardRef<HTMLDivElement, { task: z.infer<typeof taskSchema> } & React.HTMLAttributes<HTMLDivElement>>(
  ({ task, ...props }, ref) => {
    const reportedDateDisplay: DateTimeDisplay = getDateTimeDisplay(task.task.createdAt);
    const completionDateDisplay: DateTimeDisplay | undefined = task.completion && getDateTimeDisplay(task.completion.completedAt);
    const editDateDisplay: DateTimeDisplay | undefined = task.edited && getDateTimeDisplay(task.edited.editDate);
    const visibleDateDisplay: DateTimeDisplay | undefined = task.task.visibleAt && getDateTimeDisplay(task.task.visibleAt);

    const isOverdue = task.task.completeBy && Date.now() > new Date(task.task.completeBy).getTime();
    const isVisible = !task.task.visibleAt || task.task.visibleAt.getTime() <= Date.now();
    const visibleIn = task.task.visibleAt && daysAgoUtil(task.task.visibleAt).toLocaleString().replace("-", "");

    return (
      <Card
        ref={ref}
        key={task._id}
        className="my-1 border-zinc-800 bg-zinc-900/50 p-4 shadow-md/100 transition-all duration-100 hover:border-zinc-700 active:scale-95"
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <ClipboardList className={cn("size-5", task.task.urgent ? "text-red-400" : "text-amber-400")} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <p className="flex-1 font-normal text-sm text-zinc-200">{task.task.description}</p>
              <div className="flex shrink-0 gap-1.5">
                {task.task.urgent && (
                  <Badge variant="outline" className={urgencyStyle("red")}>
                    Urgent
                  </Badge>
                )}
                {isOverdue && (
                  <Badge variant="outline" className={urgencyStyle("orange")}>
                    Overdue
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start gap-1 font-normal text-xs text-zinc-500">
              {task.completion && (
                <div className="flex items-center gap-1 text-sm">
                  <Check className="h-5 w-5 text-emerald-400" />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>Completed {completionDateDisplay?.dateDaysAgo}</span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-800 fill-zinc-800" tooltipArrowClassName="bg-zinc-800 fill-zinc-800">
                        <p className="font-bold text-neutral-300 text-sm">{completionDateDisplay?.dateAbsolute}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="text-zinc-700">•</span>
                  <span>by {task.completion.completedBy.split("@")[0]}</span>
                </div>
              )}

              <div className="flex items-center gap-1 text-sm">
                <Flag className="h-5 w-5 text-indigo-300" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>Created {reportedDateDisplay.dateDaysAgo}</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-800 fill-zinc-800" tooltipArrowClassName="bg-zinc-800 fill-zinc-800">
                      <p className="font-bold text-neutral-300 text-sm">{reportedDateDisplay.dateAbsolute}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-zinc-700">•</span>
                <span>by {task.task.createdBy.split("@")[0]}</span>
              </div>

              {!isVisible && (
                <div className="flex items-center gap-1 text-sm">
                  <ClipboardClock className="h-5 w-5 text-neutral-400" />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>Visible {visibleDateDisplay?.dateDaysAgo}</span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-800 fill-zinc-800" tooltipArrowClassName="bg-zinc-800 fill-zinc-800">
                        <p className="font-bold text-neutral-300 text-sm">{visibleDateDisplay?.dateAbsolute}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

              {task.edited && (
                <div className="flex items-center gap-1 text-sm">
                  <UserPen className="h-5 w-5 text-neutral-400" />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>Edited {editDateDisplay?.dateDaysAgo}</span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-800 fill-zinc-800" tooltipArrowClassName="bg-zinc-800 fill-zinc-800">
                        <p className="font-bold text-neutral-300 text-sm">{editDateDisplay?.dateAbsolute}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className="text-zinc-700">•</span>
                  <span>by {task.edited.editedBy.split("@")[0]}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }
);

export function TaskCardSkeleton() {
  return (
    <div className="my-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-md/100">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <ClipboardList className="size-5 text-zinc-600" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            {/* description */}
            <div className="flex flex-1 flex-col">
              <div className="h-5 w-full max-w-[420px] animate-pulse rounded bg-zinc-700/50" />
            </div>

            {/* badges */}
            <div className="flex shrink-0 gap-1.5">
              <div className="h-5 w-16 animate-pulse rounded-md bg-zinc-700/50" />
              <div className="h-5 w-16 animate-pulse rounded-md bg-zinc-700/40" />
            </div>
          </div>

          <div className="flex flex-col items-start gap-1 font-normal text-xs text-zinc-500">
            {/* created metadata */}
            <div className="flex items-center gap-1 text-sm">
              <Flag className="h-5 w-5 text-indigo-300/60" />
              <div className="h-4 w-24 animate-pulse rounded bg-zinc-700/50" />
              <span className="text-zinc-700">•</span>
              <div className="h-4 w-16 animate-pulse rounded bg-zinc-700/40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
