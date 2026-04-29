import { cn } from "@redwood/shad-ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import type React from "react";
import { webClientORPC } from "../../../../lib/orpc-web-client";
import TaskHistoryDialog from "../../../classroom/[id]/_components/task/task-history-dialog";

export default function TaskOverview() {
  const { data: tasks = [], isFetching } = useQuery(
    webClientORPC.tasks.getAllTasks.queryOptions({
      input: {},
      staleTime: 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    })
  );

  const openTasks = tasks.filter((task) => !task.completion && (!task.task.visibleAt || task.task.visibleAt.getTime() <= Date.now()));
  const urgentTasks = openTasks.filter((task) => task.task.urgent);
  const overdue = tasks.filter((task) => task.task.completeBy && Date.now() > new Date(task.task.completeBy).getTime());
  const scheduled = tasks.filter((task) => task.task.visibleAt && task.task.visibleAt.getTime() > Date.now());

  function maybeWrapWithDialog(children: React.ReactNode, filteredTasks: typeof tasks, title: string) {
    if (filteredTasks.length < 1) return children;

    return (
      <TaskHistoryDialog title={title} tasks={filteredTasks}>
        {children}
      </TaskHistoryDialog>
    );
  }

  return (
    <div>
      <div className="flex items-center">
        <div className="rounded-lg border bg-zinc-700 p-1">
          <ClipboardList className="size-5" />
        </div>
        <div className="ml-2 flex flex-col">
          <span className="font-bold text-md">Tasks Overview: </span>
          <span className="text-neutral-400 text-sm">{isFetching ? "Loading..." : `${tasks.length} total tasks`}</span>
        </div>
      </div>

      <div className="flex gap-3">
        {maybeWrapWithDialog(
          <div
            className={cn(
              "mt-3 flex w-max flex-col rounded-lg border-2 p-2 shadow-lg/30 transition-all hover:-translate-y-1 hover:shadow-xl/100",
              openTasks.length > 0 ? "border-blue-800 bg-blue-950 text-blue-100" : "border-emerald-800 bg-emerald-950 text-emerald-100"
            )}
          >
            <span className={cn("font-medium", openTasks.length > 0 ? "text-blue-100" : "text-emerald-100")}>Active Tasks</span>
            <span className="font-bold text-3xl">{isFetching ? "Loading..." : openTasks.length}</span>
            <span className={cn(openTasks.length > 0 ? "text-blue-100/70" : "text-emerald-100/70")}>
              {openTasks.length > 0 ? "Currently active" : "All clear"}
            </span>
          </div>,
          openTasks,
          "All Open Tasks:"
        )}

        {maybeWrapWithDialog(
          <div
            className={cn(
              "mt-3 flex w-max flex-col rounded-lg border-2 p-2 shadow-lg/30 transition-all hover:-translate-y-1 hover:shadow-xl/100",
              overdue.length > 0 ? "border-red-800 bg-red-950 text-red-100" : "border-emerald-800 bg-emerald-950 text-emerald-100"
            )}
          >
            <span className={cn("font-medium", overdue.length > 0 ? "text-red-100" : "text-emerald-100")}>Overdue Tasks</span>
            <span className="font-bold text-3xl">{isFetching ? "Loading..." : overdue.length}</span>
            <span className={cn(overdue.length > 0 ? "text-red-100/70" : "text-emerald-100/70")}>
              {overdue.length > 0 ? "Need completion" : "All clear"}
            </span>
          </div>,
          overdue,
          "All Overdue Tasks:"
        )}

        {maybeWrapWithDialog(
          <div
            className={cn(
              "mt-3 flex w-max flex-col rounded-lg border-2 p-2 shadow-lg/30 transition-all hover:-translate-y-1 hover:shadow-xl/100",
              urgentTasks.length > 0 ? "border-amber-800 bg-amber-950 text-amber-100" : "border-emerald-800 bg-emerald-950 text-emerald-100"
            )}
          >
            <span className={cn("font-medium", urgentTasks.length > 0 ? "text-amber-100" : "text-emerald-100")}>Urgent Tasks</span>
            <span className="whitespace-nowrap font-bold text-3xl">{isFetching ? "Loading..." : urgentTasks.length}</span>
            <span className={cn(urgentTasks.length > 0 ? "text-amber-100/70" : "text-emerald-100/70")}>
              {urgentTasks.length > 0 ? "Need priority" : "All clear"}
            </span>
          </div>,
          urgentTasks,
          "All Urgent Tasks:"
        )}

        {maybeWrapWithDialog(
          <div
            className={cn(
              "mt-3 flex w-max flex-col rounded-lg border-2 p-2 shadow-lg/30 transition-all hover:-translate-y-1 hover:shadow-xl/100",
              scheduled.length > 0 ? "border-slate-700 bg-slate-800 text-slate-100" : "border-emerald-800 bg-emerald-950 text-emerald-100"
            )}
          >
            <span className={cn("font-medium", scheduled.length > 0 ? "text-slate-100" : "text-emerald-100")}>Scheduled Tasks</span>
            <span className="whitespace-nowrap font-bold text-3xl">{isFetching ? "Loading..." : scheduled.length}</span>
            <span className={cn(scheduled.length > 0 ? "text-slate-100/70" : "text-emerald-100/70")}>
              {scheduled.length > 0 ? "Scheduled for later" : "All clear"}
            </span>
          </div>,
          scheduled,
          "All Scheduled Tasks:"
        )}
      </div>
    </div>
  );
}
