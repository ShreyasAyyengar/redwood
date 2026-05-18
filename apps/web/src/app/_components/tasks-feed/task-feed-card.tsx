import type { taskSchema } from "@redwood/contracts";
import { Badge } from "@redwood/shad-ui/components/badge";
import { Card } from "@redwood/shad-ui/components/card";
import { cn } from "@redwood/shad-ui/lib/utils";
import { Calendar, CheckCircle2, ClipboardList, Clock3, Eye, type LucideIcon, MessageSquare, User, UserCheck } from "lucide-react";
import type { RefObject } from "react";
import type { z } from "zod";
import { getDateTimeDisplay } from "../../../util/date-time-utils";
import { urgencyStyle } from "../../../util/style-util";
import { ClassroomAvailabilityPill } from "../classroom-availability-pill";
import { useFetchedRoomsStore } from "../room-store";

type TaskFeedCardTask = z.infer<typeof taskSchema>;
type DateDisplay = ReturnType<typeof getDateTimeDisplay>;

function TaskMetaBox({
  icon: Icon,
  label,
  value,
  title,
  className,
  iconClassName,
  valueClassName,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  title?: string;
  className?: string;
  iconClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("flex flex-1 items-center gap-3 rounded-2xl border p-3 text-xs text-zinc-400", className)} title={title}>
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", iconClassName)}>
        <Icon className="size-4" />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="font-semibold text-[10px] text-zinc-500 uppercase tracking-[0.18em]">{label}</span>
        <span className={cn("truncate text-sm text-zinc-300", valueClassName)}>{value}</span>
      </div>
    </div>
  );
}

function TaskCompletionSection({
  completion,
  completionDateDisplay,
}: {
  completion: NonNullable<TaskFeedCardTask["completion"]>;
  completionDateDisplay: DateDisplay | undefined;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
      {completion.comment && (
        <div className="flex items-start gap-3">
          <MessageSquare className="mt-0.5 size-4 shrink-0 text-emerald-500/50" />
          <div className="flex flex-col">
            <span className="font-bold text-[10px] text-emerald-500/70 uppercase tracking-[0.18em]">Completion Note</span>
            <p className="text-emerald-200/90 text-sm leading-relaxed">{completion.comment}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row">
        <TaskMetaBox
          className="border-emerald-500/10 bg-emerald-500/5"
          icon={UserCheck}
          iconClassName="bg-emerald-500/10 text-emerald-400"
          label="Completed By"
          value={completion.completedBy}
        />

        {completionDateDisplay && (
          <TaskMetaBox
            className="border-emerald-500/10 bg-emerald-500/5"
            icon={Clock3}
            iconClassName="bg-emerald-500/10 text-emerald-400"
            label="Completed"
            title={`Completed: ${completionDateDisplay.dateAbsolute}`}
            value={completionDateDisplay.dateDaysAgo}
            valueClassName="text-emerald-200"
          />
        )}
      </div>
    </div>
  );
}

function getTaskDisplayState(task: TaskFeedCardTask) {
  const isCompleted = Boolean(task.completion);
  const isOverdue = Boolean(!task.completion && task.task.completeBy && Date.now() > new Date(task.task.completeBy).getTime());
  const isVisible = !task.task.visibleAt || new Date(task.task.visibleAt).getTime() <= Date.now();

  if (isCompleted) {
    return {
      HeaderIcon: CheckCircle2,
      StateIcon: CheckCircle2,
      headerIconClassName: "border-emerald-500/20 bg-emerald-500/10",
      headerIconTextClassName: "text-emerald-400",
      isCompleted,
      isOverdue,
      isVisible,
      stateIconClassName: "bg-emerald-500/10 text-emerald-400",
      stateText: "Closed out",
      stateTextClassName: "text-emerald-300",
    };
  }

  if (isOverdue) {
    return {
      HeaderIcon: ClipboardList,
      StateIcon: Calendar,
      headerIconClassName: task.task.urgent ? "border-red-500/20 bg-red-500/10" : "border-amber-500/20 bg-amber-500/10",
      headerIconTextClassName: task.task.urgent ? "text-red-400" : "text-amber-400",
      isCompleted,
      isOverdue,
      isVisible,
      stateIconClassName: "bg-red-500/10 text-red-400",
      stateText: "Past due",
      stateTextClassName: "text-amber-300",
    };
  }

  if (!isVisible) {
    return {
      HeaderIcon: ClipboardList,
      StateIcon: Eye,
      headerIconClassName: task.task.urgent ? "border-red-500/20 bg-red-500/10" : "border-amber-500/20 bg-amber-500/10",
      headerIconTextClassName: task.task.urgent ? "text-red-400" : "text-amber-400",
      isCompleted,
      isOverdue,
      isVisible,
      stateIconClassName: "bg-zinc-800/80 text-zinc-400",
      stateText: "Queued",
      stateTextClassName: "text-zinc-200",
    };
  }

  return {
    HeaderIcon: ClipboardList,
    StateIcon: task.task.completeBy ? Calendar : ClipboardList,
    headerIconClassName: task.task.urgent ? "border-red-500/20 bg-red-500/10" : "border-amber-500/20 bg-amber-500/10",
    headerIconTextClassName: task.task.urgent ? "text-red-400" : "text-amber-400",
    isCompleted,
    isOverdue,
    isVisible,
    stateIconClassName: task.task.urgent ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400",
    stateText: task.task.urgent ? "Needs Urgent Attention" : "In progress",
    stateTextClassName: task.task.urgent ? "text-amber-300" : "text-zinc-200",
  };
}

export const TaskFeedCard = ({
  task,
  className,
  ref,
  ...props
}: { task: z.infer<typeof taskSchema> } & React.HTMLAttributes<HTMLDivElement> & { ref?: RefObject<HTMLDivElement | null> }) => {
  const { fetchedRooms } = useFetchedRoomsStore();
  const room = fetchedRooms.find((r) => r._id === task.classroomId);

  const reportedDateDisplay = getDateTimeDisplay(task.task.createdAt);
  const completionDateDisplay = task.completion && getDateTimeDisplay(task.completion.completedAt);
  const visibleDateDisplay = task.task.visibleAt && getDateTimeDisplay(task.task.visibleAt);
  const completeByDateDisplay = task.task.completeBy && getDateTimeDisplay(task.task.completeBy);
  const {
    HeaderIcon,
    StateIcon,
    headerIconClassName,
    headerIconTextClassName,
    isOverdue,
    isVisible,
    stateIconClassName,
    stateText,
    stateTextClassName,
  } = getTaskDisplayState(task);
  const shouldShowSchedulingRow = Boolean(completeByDateDisplay || (!isVisible && !task.completion && visibleDateDisplay));

  if (!room) return null;

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
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
              headerIconClassName
            )}
          >
            <HeaderIcon className={cn("size-6", headerIconTextClassName)} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-col gap-2">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <span className="font-bold text-lg text-zinc-100 leading-tight">{room.displayName}</span>
                {room && <ClassroomAvailabilityPill room={room} />}
              </div>
              {task.task.supervisorNeeded && (
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className={cn("h-6 px-2 text-[10px]", urgencyStyle("purple"))}>
                    Supervisor needed
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/70 to-transparent" />
        <p className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed">{task.task.description}</p>

        <div className="flex flex-col gap-3 md:flex-row">
          <TaskMetaBox
            className="border-zinc-800/80 bg-zinc-950/30"
            icon={Clock3}
            iconClassName="bg-zinc-800/80"
            label="Created At"
            value={reportedDateDisplay.dateDaysAgo}
          />

          <TaskMetaBox
            className="border-zinc-800/80 bg-zinc-950/30"
            icon={User}
            iconClassName="bg-zinc-800/80"
            label="Created By"
            value={task.task.createdBy}
          />

          <TaskMetaBox
            className="border-zinc-800/80 bg-zinc-950/30"
            icon={StateIcon}
            iconClassName={stateIconClassName}
            label="State"
            value={stateText}
            valueClassName={cn("font-medium", stateTextClassName)}
          />
        </div>

        {shouldShowSchedulingRow && (
          <div className="flex flex-col gap-3 md:flex-row">
            {completeByDateDisplay && (
              <TaskMetaBox
                className="border-zinc-800/80 bg-zinc-950/30"
                icon={Calendar}
                iconClassName={isOverdue ? "bg-red-500/10 text-red-400" : "bg-zinc-800/80"}
                label="Due"
                value={completeByDateDisplay.dateDaysAgo}
                valueClassName={isOverdue ? "text-red-300" : "text-zinc-300"}
              />
            )}

            {!isVisible && !task.completion && visibleDateDisplay && (
              <TaskMetaBox
                className="border-zinc-800/80 bg-zinc-950/30"
                icon={Eye}
                iconClassName="bg-zinc-800/80"
                label="Visible"
                value={visibleDateDisplay.dateDaysAgo.replace("-", "")}
              />
            )}
          </div>
        )}
      </div>

      {task.completion && <TaskCompletionSection completion={task.completion} completionDateDisplay={completionDateDisplay || undefined} />}
    </Card>
  );
};
