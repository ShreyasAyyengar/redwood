import type { issueSchema } from "@redwood/contracts";
import { Badge } from "@redwood/shad-ui/components/badge";
import { Card } from "@redwood/shad-ui/components/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@redwood/shad-ui/components/tooltip";
import { cn } from "@redwood/shad-ui/lib/utils";
import { Check, Flag, TriangleAlert, UserPen } from "lucide-react";
import type { RefObject } from "react";
import type { z } from "zod";
import { type DateTimeDisplay, getDateTimeDisplay } from "../../../../../util/date-time-utils";
import { urgencyStyle } from "../../../../../util/style-util";

export const IssueCard = ({
  issue,
  ref,
  ...props
}: { issue: z.infer<typeof issueSchema> } & React.HTMLAttributes<HTMLDivElement> & { ref?: RefObject<HTMLDivElement | null> }) => {
  const reportedDateDisplay: DateTimeDisplay = getDateTimeDisplay(issue.issue.reportedAt);
  const resolutionDateDisplay: DateTimeDisplay | undefined = issue.resolution && getDateTimeDisplay(issue.resolution.resolvedAt);
  const editedDateDisplay: DateTimeDisplay | undefined = issue.edited && getDateTimeDisplay(issue.edited.editDate);

  return (
    <Card
      ref={ref}
      key={issue._id}
      className="my-1 border-zinc-800 bg-zinc-900/50 p-4 shadow-md/100 transition-all duration-100 hover:border-zinc-700 active:scale-95"
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <TriangleAlert className={cn("size-5", issue.issue.urgent ? "text-red-400" : "text-amber-400")} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
            <p className="flex-1 font-normal text-sm text-zinc-200">{issue.issue.description}</p>
            <div className="flex shrink-0 gap-1.5">
              {issue.issue.urgent && (
                <Badge variant="outline" className={urgencyStyle("red")}>
                  Urgent
                </Badge>
              )}
              {issue.issue.supervisorNeeded && (
                <Badge variant="outline" className={urgencyStyle("purple")}>
                  Supervisor Needed
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1 font-normal text-xs text-zinc-500">
            {issue.resolution && (
              <div className="flex items-center gap-1 text-sm">
                <Check className="size-5 text-emerald-400" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>Resolved {resolutionDateDisplay?.dateDaysAgo}</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-800 fill-zinc-800" tooltipArrowClassName="bg-zinc-800 fill-zinc-800">
                      <p className="font-bold text-neutral-300 text-sm">{resolutionDateDisplay?.dateAbsolute}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-zinc-700">•</span>
                <span>by {issue.resolution.resolvedBy.split("@")[0]}</span>
              </div>
            )}

            <div className="flex items-center gap-1 text-sm">
              <Flag className="size-5 text-indigo-300" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>Reported {reportedDateDisplay.dateDaysAgo}</span>
                  </TooltipTrigger>
                  <TooltipContent className="bg-zinc-800 fill-zinc-800" tooltipArrowClassName="bg-zinc-800 fill-zinc-800">
                    <p className="font-bold text-neutral-300 text-sm">{reportedDateDisplay.dateAbsolute}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-zinc-700">•</span>
              <span>by {issue.issue.reportedBy.split("@")[0]}</span>
            </div>

            {issue.edited && (
              <div className="flex items-center gap-1 text-sm">
                <UserPen className="size-5 text-neutral-400" />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>Edited {editedDateDisplay?.dateDaysAgo}</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-800 fill-zinc-800" tooltipArrowClassName="bg-zinc-800 fill-zinc-800">
                      <p className="font-bold text-neutral-300 text-sm">{editedDateDisplay?.dateAbsolute}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-zinc-700">•</span>
                <span>by {issue.edited.editedBy.split("@")[0]}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export function IssueCardSkeleton() {
  return (
    <div className="my-1 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-md/100">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          <TriangleAlert className="size-5 text-zinc-600" />
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
            {/* reported metadata */}
            <div className="flex items-center gap-1 text-sm">
              <Flag className="size-5 text-indigo-300/60" />
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
