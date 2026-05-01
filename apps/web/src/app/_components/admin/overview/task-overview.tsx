import type { taskSchema } from "@redwood/contracts";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import type React from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../../lib/orpc-web-client";
import { TaskListDialog } from "../../../classroom/[id]/_components/task/task-list-dialog";

function maybeWrapWithDialog(children: React.ReactNode, filteredTasks: z.infer<typeof taskSchema>[], title: string) {
  if (filteredTasks.length < 1) return children;

  return (
    <TaskListDialog title={title} tasks={filteredTasks} foreignView={true}>
      {children}
    </TaskListDialog>
  );
}

type TaskStatCardProps = React.HTMLAttributes<HTMLDivElement> & {
  activeClassName: string;
  activeDescription: string;
  activeMutedTextClassName: string;
  activeTextClassName: string;
  count: number;
  inactiveDescription?: string;
  isFetching: boolean;
  ref?: React.Ref<HTMLDivElement>;
  title: string;
  valueClassName?: string;
};

function TaskStatCard({
  activeClassName,
  activeDescription,
  activeMutedTextClassName,
  activeTextClassName,
  className,
  count,
  inactiveDescription = "All clear",
  isFetching,
  ref,
  title,
  valueClassName,
  ...props
}: TaskStatCardProps) {
  const hasTasks = count > 0;
  const textClassName = hasTasks ? activeTextClassName : "text-emerald-100";

  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        "mt-3 flex w-max flex-col rounded-lg border-2 p-2 shadow-lg/30 transition-all hover:-translate-y-1 hover:shadow-xl/100",
        hasTasks ? activeClassName : "border-emerald-800 bg-emerald-950 text-emerald-100",
        className
      )}
    >
      <span className={cn("font-medium", textClassName)}>{title}</span>
      <span className={cn("font-bold text-3xl", valueClassName)}>{isFetching ? "Loading..." : count}</span>
      <span className={cn(hasTasks ? activeMutedTextClassName : "text-emerald-100/70")}>
        {hasTasks ? activeDescription : inactiveDescription}
      </span>
    </div>
  );
}

export default function TaskOverview() {
  const { data: tasks = [], isFetching } = useQuery(
    webClientORPC.tasks.getOpenTasks.queryOptions({
      staleTime: 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    })
  );

  const openTasks = tasks.filter((task) => !task.completion && (!task.task.visibleAt || task.task.visibleAt.getTime() <= Date.now()));
  const urgentTasks = openTasks.filter((task) => task.task.urgent);
  const overdue = tasks.filter((task) => task.task.completeBy && Date.now() > new Date(task.task.completeBy).getTime());
  const scheduled = tasks.filter((task) => task.task.visibleAt && task.task.visibleAt.getTime() > Date.now());

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
          <TaskStatCard
            activeClassName="border-blue-800 bg-blue-950 text-blue-100"
            activeDescription="Currently active"
            activeMutedTextClassName="text-blue-100/70"
            activeTextClassName="text-blue-100"
            count={openTasks.length}
            isFetching={isFetching}
            title="Open Tasks"
          />,
          openTasks,
          "All Open Tasks:"
        )}

        {maybeWrapWithDialog(
          <TaskStatCard
            activeClassName="border-red-800 bg-red-950 text-red-100"
            activeDescription="Need completion"
            activeMutedTextClassName="text-red-100/70"
            activeTextClassName="text-red-100"
            count={overdue.length}
            isFetching={isFetching}
            title="Overdue Tasks"
          />,
          overdue,
          "All Overdue Tasks:"
        )}

        {maybeWrapWithDialog(
          <TaskStatCard
            activeClassName="border-amber-800 bg-amber-950 text-amber-100"
            activeDescription="Need priority"
            activeMutedTextClassName="text-amber-100/70"
            activeTextClassName="text-amber-100"
            count={urgentTasks.length}
            isFetching={isFetching}
            title="Urgent Tasks"
            valueClassName="whitespace-nowrap"
          />,
          urgentTasks,
          "All Urgent Tasks:"
        )}

        {maybeWrapWithDialog(
          <TaskStatCard
            activeClassName="border-slate-700 bg-slate-800 text-slate-100"
            activeDescription="Scheduled for later"
            activeMutedTextClassName="text-slate-100/70"
            activeTextClassName="text-slate-100"
            count={scheduled.length}
            isFetching={isFetching}
            title="Scheduled Tasks"
            valueClassName="whitespace-nowrap"
          />,
          scheduled,
          "All Scheduled Tasks:"
        )}
      </div>
    </div>
  );
}
