import type { taskSchema } from "@redwood/contracts";
import { Badge } from "@redwood/shad-ui/components/badge";
import { Card } from "@redwood/shad-ui/components/card";
import { cn } from "@redwood/shad-ui/lib/utils";
import { Check, ClipboardClock, ClipboardList, Flag, UserPen } from "lucide-react";
import type React from "react";
import { forwardRef } from "react";
import type { z } from "zod";
import { daysAgo as daysAgoUtil } from "../../../../../util/date-time-utils";
import { urgencyStyle } from "../../../../../util/style-util";

export const TaskCard = forwardRef<HTMLDivElement, { task: z.infer<typeof taskSchema> } & React.HTMLAttributes<HTMLDivElement>>(
  ({ task, ...props }, ref) => {
    const daysAgo = daysAgoUtil(task.task.createdAt);
    const editDaysAgo = task.edited && daysAgoUtil(task.edited.editDate);
    const completionDaysAgo = task.completion && daysAgoUtil(task.completion.completedAt);

    const isOverdue = task.task.completeBy && Date.now() > new Date(task.task.completeBy).getTime();
    const isVisible = !task.task.visibleAt || task.task.visibleAt.getTime() <= Date.now();
    const visibleIn = task.task.visibleAt && daysAgoUtil(task.task.visibleAt).toLocaleString().replace("-", "");

    return (
      <Card
        ref={ref}
        key={task._id}
        className="my-1 border-zinc-800 bg-zinc-900/50 p-4 transition-all duration-100 hover:border-zinc-700 active:scale-95"
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
                  <span>
                    Completed {completionDaysAgo === 0 ? "today" : completionDaysAgo === 1 ? "yesterday" : `${completionDaysAgo} days ago`}
                  </span>
                  <span className="text-zinc-700">•</span>
                  <span>by {task.completion.completedBy.split("@")[0]}</span>
                </div>
              )}

              <div className="flex items-center gap-1 text-sm">
                <Flag className="h-5 w-5 text-indigo-300" />
                <span>Created {daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`}</span>
                <span className="text-zinc-700">•</span>
                <span>by {task.task.createdBy.split("@")[0]}</span>
              </div>

              {!isVisible && (
                <div className="flex items-center gap-1 text-sm">
                  <ClipboardClock className="h-5 w-5 text-neutral-400" />
                  <span>Visible in {visibleIn} days</span>
                </div>
              )}

              {task.edited && (
                <div className="flex items-center gap-1 text-sm">
                  <UserPen className="h-5 w-5 text-neutral-400" />
                  <span>Edited {editDaysAgo === 0 ? "today" : editDaysAgo === 1 ? "yesterday" : `${editDaysAgo} days ago`}</span>
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
