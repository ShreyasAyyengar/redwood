import type { issueSchema } from "@redwood/contracts";
import { Badge } from "@redwood/shad-ui/components/badge";
import { Card } from "@redwood/shad-ui/components/card";
import { cn } from "@redwood/shad-ui/lib/utils";
import { Clock3, MessageSquare, ThumbsUp, TriangleAlert, User, UserCheck } from "lucide-react";
import type { RefObject } from "react";
import type { z } from "zod";
import { getDateTimeDisplay } from "../../../util/date-time-utils";
import { urgencyStyle } from "../../../util/style-util";
import { getStatusSymbol } from "../../classroom/[id]/_components/issue/issue-card";
import { useFetchedRoomsStore } from "../room-store";

export const IssueFeedCard = ({
  issue,
  className,
  ref,
  ...props
}: { issue: z.infer<typeof issueSchema> } & React.HTMLAttributes<HTMLDivElement> & { ref?: RefObject<HTMLDivElement | null> }) => {
  const { fetchedRooms } = useFetchedRoomsStore();
  const room = fetchedRooms.find((r) => r._id === issue.classroomId);

  const reportedDateDisplay = getDateTimeDisplay(issue.issue.reportedAt);
  const resolutionDateDisplay = issue.resolution && getDateTimeDisplay(issue.resolution.resolvedAt);
  const isResolved = Boolean(issue.resolution);
  const getStatusText = () => {
    if (isResolved) return "Closed";
    if (issue.issue.sodId) return `Escalated to MSE: ${issue.issue.sodId}`;
    if (issue.issue.cruzfixId) return `Escalated to CruzFix: ${issue.issue.cruzfixId}`;
    if (issue.issue.urgent) return "Needs Urgent Attention";
    return "Needs attention";
  };

  return (
    <Card
      ref={ref}
      className={cn(
        "flex w-full flex-col gap-4 border-zinc-800/80 bg-zinc-900/50 p-4 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/70 active:scale-[0.99]",
        className
      )}
      {...props}
    >
      <div className="flex w-full min-w-0 flex-col gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
              isResolved
                ? "border-emerald-500/20 bg-emerald-500/10"
                : issue.issue.urgent
                  ? "border-red-500/20 bg-red-500/10"
                  : "border-amber-500/20 bg-amber-500/10"
            )}
          >
            {isResolved ? (
              <ThumbsUp className="size-6 text-emerald-400" />
            ) : (
              <TriangleAlert className={cn("size-6", issue.issue.urgent ? "text-red-400" : "text-amber-400")} />
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-col gap-2">
              <span className="font-bold text-lg text-zinc-100 leading-tight">{room ? room.displayName : "Unknown Room"}</span>
              {issue.issue.supervisorNeeded && (
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
        <p className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed">{issue.issue.description}</p>

        <div className="flex flex-col gap-3 md:flex-row">
          <div
            className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/30 p-3 text-xs text-zinc-400"
            title={`Reported: ${reportedDateDisplay.dateAbsolute}`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800/80 text-indigo-200">
              <Clock3 className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-[10px] text-zinc-400 uppercase tracking-[0.18em]">Reported</span>
              <span className="text-indigo-100 text-sm">{reportedDateDisplay.dateDaysAgo}</span>
            </div>
          </div>

          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/30 p-3 text-xs text-zinc-400">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800/80">
              <User className="size-4" />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="font-semibold text-[10px] text-zinc-500 uppercase tracking-[0.18em]">Reporter</span>
              <span className="truncate text-sm text-zinc-300">{issue.issue.reportedBy}</span>
            </div>
          </div>

          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/30 p-3 text-xs text-zinc-400">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full",
                isResolved
                  ? "bg-emerald-500/10 text-emerald-400"
                  : issue.issue.urgent
                    ? "bg-red-500/10 text-red-400"
                    : "bg-amber-500/10 text-amber-400"
              )}
            >
              {getStatusSymbol(issue, 4)}
              {/*{isResolved ? <ThumbsUp className="size-4" /> : <TriangleAlert className="size-4" />}*/}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="font-semibold text-[10px] text-zinc-500 uppercase tracking-[0.18em]">Status</span>
              <span
                className={cn(
                  "truncate font-medium text-sm",
                  isResolved ? "text-emerald-300" : issue.issue.sodId ? "text-amber-300" : "text-zinc-200"
                )}
              >
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {issue.resolution && (
        <div className="flex flex-col gap-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
          {issue.resolution.comment && (
            <div className="flex items-start gap-3">
              <MessageSquare className="mt-0.5 size-4 shrink-0 text-emerald-500/50" />
              <div className="flex flex-col">
                <span className="font-bold text-[10px] text-emerald-500/70 uppercase tracking-[0.18em]">Resolution Note</span>
                <p className="text-emerald-200/90 text-sm leading-relaxed">{issue.resolution.comment}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-3 text-xs text-zinc-400">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <UserCheck className="size-4" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="font-semibold text-[10px] text-emerald-500/70 uppercase tracking-[0.18em]">Resolved By</span>
                <span className="truncate text-sm text-zinc-300">{issue.resolution.resolvedBy}</span>
              </div>
            </div>

            {resolutionDateDisplay && (
              <div
                className="flex flex-1 items-center gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-3 text-xs text-zinc-400"
                title={`Resolved: ${resolutionDateDisplay.dateAbsolute}`}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <Clock3 className="size-4" />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-[10px] text-emerald-500/70 uppercase tracking-[0.18em]">Resolved</span>
                  <span className="text-emerald-200 text-sm">{resolutionDateDisplay.dateDaysAgo}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
