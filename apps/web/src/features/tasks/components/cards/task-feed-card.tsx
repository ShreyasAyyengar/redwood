import type { Doc } from "@backend/convex/_generated/dataModel";
import { Badge } from "@redwood/shad-ui/components/badge";
import { Card } from "@redwood/shad-ui/components/card";
import { cn } from "@redwood/shad-ui/lib/utils";
import { Calendar, CheckCircle2, ClipboardList, Clock3, Eye, TriangleAlert, User, UserCheck } from "lucide-react";
import type { RefObject } from "react";
import { ClassroomAvailabilityPill } from "#/features/classrooms/components/classroom-availability-pill.tsx";
import { FeedCardDetails, FeedCardMetadata, FeedCardMetadataList, FeedCardNote } from "#/features/feed/components/feed-card-details.tsx";
import { getDateTimeDisplay } from "#/util/date-time-utils.ts";
import { urgencyStyle } from "#/util/style-util.ts";

type TaskFeedCardTask = Doc<"tasks">;
type DateDisplay = ReturnType<typeof getDateTimeDisplay>;

function TaskCompletionSection({
  completion,
  completionDateDisplay,
}: {
  completion: NonNullable<TaskFeedCardTask["completion"]>;
  completionDateDisplay: DateDisplay | undefined;
}) {
  return (
    <FeedCardNote label="Completion" comment={completion.comment}>
      <FeedCardMetadataList>
        <FeedCardMetadata icon={UserCheck} title={`Completed by: ${completion.completedBy}`}>
          <span className="sr-only">Completed by </span>
          {completion.completedBy}
        </FeedCardMetadata>
        {completionDateDisplay && (
          <FeedCardMetadata icon={Clock3} title={`Completed: ${completionDateDisplay.dateAbsolute}`}>
            Completed {completionDateDisplay.dateDaysAgo}
          </FeedCardMetadata>
        )}
      </FeedCardMetadataList>
    </FeedCardNote>
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
      stateText: "Past due",
      stateTextClassName: "text-red-400",
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
      stateText: "Queued",
      stateTextClassName: "text-zinc-400",
    };
  }

  return {
    HeaderIcon: ClipboardList,
    StateIcon: task.task.urgent ? TriangleAlert : task.task.completeBy ? Calendar : ClipboardList,
    headerIconClassName: task.task.urgent ? "border-red-500/20 bg-red-500/10" : "border-amber-500/20 bg-amber-500/10",
    headerIconTextClassName: task.task.urgent ? "text-red-400" : "text-amber-400",
    isCompleted,
    isOverdue,
    isVisible,
    stateText: task.task.urgent ? "Needs urgent attention" : "Open",
    stateTextClassName: task.task.urgent ? "text-red-400" : "text-amber-400",
  };
}

export const TaskFeedCard = ({
  task,
  classroom,
  className,
  ref,
  ...props
}: { task: Doc<"tasks">; classroom?: Doc<"classrooms"> } & React.HTMLAttributes<HTMLDivElement> & {
    ref?: RefObject<HTMLDivElement | null>;
  }) => {
  const reportedDateDisplay = getDateTimeDisplay(new Date(task.task.createdAt));
  const completionDateDisplay = task.completion ? getDateTimeDisplay(new Date(task.completion.completedAt)) : undefined;
  const visibleDateDisplay = task.task.visibleAt ? getDateTimeDisplay(new Date(task.task.visibleAt)) : undefined;
  const completeByDateDisplay = task.task.completeBy ? getDateTimeDisplay(new Date(task.task.completeBy)) : undefined;
  const { HeaderIcon, StateIcon, headerIconClassName, headerIconTextClassName, isOverdue, isVisible, stateText, stateTextClassName } =
    getTaskDisplayState(task);
  const statusMetadata =
    stateText === "Open" ? null : (
      <FeedCardMetadata icon={StateIcon} className={cn("font-medium", stateTextClassName)}>
        {stateText}
      </FeedCardMetadata>
    );

  if (!classroom) return null;

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
                <span className="font-bold text-lg text-zinc-100 leading-tight">{classroom.displayName}</span>
                <ClassroomAvailabilityPill room={classroom} />
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

      <FeedCardDetails
        label="Task"
        description={task.task.description}
        metadata={
          <FeedCardMetadataList>
            {!task.completion && statusMetadata}
            <FeedCardMetadata icon={Clock3} title={`Created: ${reportedDateDisplay.dateAbsolute}`}>
              Created {reportedDateDisplay.dateDaysAgo}
            </FeedCardMetadata>
            <FeedCardMetadata icon={User} title={`Created by: ${task.task.createdBy}`}>
              <span className="sr-only">Created by </span>
              {task.task.createdBy}
            </FeedCardMetadata>
            {completeByDateDisplay && (
              <FeedCardMetadata
                icon={Calendar}
                title={`Due: ${completeByDateDisplay.dateAbsolute}`}
                className={isOverdue ? "text-red-400" : undefined}
              >
                Due {completeByDateDisplay.dateDaysAgo}
              </FeedCardMetadata>
            )}
            {!isVisible && !task.completion && visibleDateDisplay && (
              <FeedCardMetadata icon={Eye} title={`Visible: ${visibleDateDisplay.dateAbsolute}`}>
                Visible {visibleDateDisplay.dateDaysAgo}
              </FeedCardMetadata>
            )}
            {task.completion && statusMetadata}
          </FeedCardMetadataList>
        }
        note={
          task.completion && <TaskCompletionSection completion={task.completion} completionDateDisplay={completionDateDisplay || undefined} />
        }
      />
    </Card>
  );
};
