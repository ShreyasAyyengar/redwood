import type { issueSchema } from "@redwood/contracts";
import { Badge } from "@redwood/shad-ui/components/badge";
import { Card } from "@redwood/shad-ui/components/card";
import { cn } from "@redwood/shad-ui/lib/utils";
import { TriangleAlert, Clock3, MessageSquare, Paperclip, ShieldAlert, User, UserCheck } from "lucide-react";
import { forwardRef } from "react";
import type { z } from "zod";
import { getDateTimeDisplay } from "../../../util/date-time-utils";
import { urgencyStyle } from "../../../util/style-util";
import { FeedMetaPill } from "../feed-meta-pill";
import { useFetchedRoomsStore } from "../room-store";

export const IssueFeedCard = forwardRef<HTMLDivElement, { issue: z.infer<typeof issueSchema> } & React.HTMLAttributes<HTMLDivElement>>(
  ({ issue, className, ...props }, ref) => {
    const { fetchedRooms } = useFetchedRoomsStore();
    const room = fetchedRooms.find((r) => r._id === issue.classroomId);

    const reportedDateDisplay = getDateTimeDisplay(issue.issue.reportedAt);
    const resolutionDateDisplay = issue.resolution && getDateTimeDisplay(issue.resolution.resolvedAt);
    const referenceIds = [
      issue.issue.sodId ? `SOD ${issue.issue.sodId}` : null,
      issue.issue.cruzfixId ? `CF ${issue.issue.cruzfixId}` : null,
    ].filter(Boolean);

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
                issue.issue.urgent ? "border-red-500/20 bg-red-500/10" : "border-amber-500/20 bg-amber-500/10"
              )}
            >
              <TriangleAlert className={cn("size-6", issue.issue.urgent ? "text-red-400" : "text-amber-400")} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-2">
                <span className="font-bold text-lg text-zinc-100 leading-tight">{room ? room.displayName : "Unknown Room"}</span>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="h-6 border-zinc-800 bg-zinc-950/70 px-2 text-[10px] text-zinc-300">
                    {issue.resolution ? "Resolved issue" : "Open issue"}
                  </Badge>
                  {issue.issue.urgent && (
                    <Badge variant="outline" className={cn("h-6 px-2 text-[10px]", urgencyStyle("red"))}>
                      Urgent
                    </Badge>
                  )}
                  {issue.issue.supervisorNeeded && (
                    <Badge variant="outline" className={cn("h-6 px-2 text-[10px]", urgencyStyle("purple"))}>
                      Supervisor needed
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <FeedMetaPill
                  icon={Clock3}
                  label="Reported"
                  value={reportedDateDisplay.dateDaysAgo}
                  tooltip={`Reported: ${reportedDateDisplay.dateAbsolute}`}
                  tone="accent"
                />
                {resolutionDateDisplay && (
                  <FeedMetaPill
                    icon={UserCheck}
                    label="Resolved"
                    value={resolutionDateDisplay.dateDaysAgo}
                    tooltip={`Resolved: ${resolutionDateDisplay.dateAbsolute}`}
                    tone="success"
                  />
                )}
                {referenceIds.map((reference) => (
                  <div
                    key={reference}
                    className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-950/60 px-2.5 py-1 font-mono text-[11px] text-zinc-400"
                  >
                    {reference}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid w-full min-w-0 grid-cols-1 gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-3">
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.18em]">Reported By</span>
              <p className="mt-1 truncate font-medium text-sm text-zinc-200">{issue.issue.reportedBy}</p>
            </div>
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-3">
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.18em]">Status</span>
              <p className={cn("mt-1 font-medium text-sm", issue.resolution ? "text-emerald-300" : "text-zinc-200")}>
                {issue.resolution ? "Closed out" : "Needs attention"}
              </p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/70 to-transparent" />
          <p className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed">{issue.issue.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/30 p-3 text-xs text-zinc-400">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800/80">
              <User className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-[10px] text-zinc-500 uppercase tracking-[0.18em]">Reporter</span>
              <span className="text-sm text-zinc-300">{issue.issue.reportedBy}</span>
            </div>
          </div>

          {issue.resolution && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-3 text-xs text-zinc-400">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <UserCheck className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-[10px] text-emerald-500/70 uppercase tracking-[0.18em]">Resolved By</span>
                <span className="text-sm text-zinc-300">{issue.resolution.resolvedBy}</span>
              </div>
            </div>
          )}
        </div>

        {issue.resolution?.comment && (
          <div className="mt-1 flex items-start gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-3">
            <MessageSquare className="mt-0.5 size-4 text-emerald-500/50" />
            <div className="flex flex-col">
              <span className="font-bold text-[10px] text-emerald-500/70 uppercase tracking-[0.18em]">Resolution Note</span>
              <p className="text-emerald-200/90 text-sm">{issue.resolution.comment}</p>
            </div>
          </div>
        )}

        {(issue.adminNotes.length > 0 || (issue.files && issue.files.length > 0)) && (
          <div className="flex flex-wrap items-center gap-2 px-1 text-[11px] text-zinc-400">
            {issue.adminNotes.length > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/60 px-2.5 py-1">
                <ShieldAlert className="size-3.5" />
                <span>
                  {issue.adminNotes.length} Admin Note{issue.adminNotes.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
            {issue.files && issue.files.length > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/60 px-2.5 py-1">
                <Paperclip className="size-3.5" />
                <span>
                  {issue.files.length} Attachment{issue.files.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        )}
      </Card>
    );
  }
);
