import type { issueSchema } from "@redwood/contracts";
import { Badge } from "@redwood/shad-ui/components/badge";
import { Card } from "@redwood/shad-ui/components/card";
import { AlertCircle, AlertTriangle, Check, Flag, UserPen } from "lucide-react";
import { forwardRef } from "react";
import type { z } from "zod";
import { daysAgo as daysAgoUtil } from "../../../../../util/date-time-utils";
import { urgencyStyle } from "../../../../../util/style-util";

export const IssueCard = forwardRef<HTMLDivElement, { issue: z.infer<typeof issueSchema> } & React.HTMLAttributes<HTMLDivElement>>(
  ({ issue, ...props }, ref) => {
    const daysAgo = daysAgoUtil(new Date(issue.issue.reportedAt));
    const editDaysAgo = issue.edited && daysAgoUtil(new Date(issue.edited.editDate));
    const resolutionDaysAgo = issue.resolution && daysAgoUtil(new Date(issue.resolution.resolvedAt));

    return (
      <Card
        ref={ref}
        key={issue._id}
        className="my-1 border-zinc-800 bg-zinc-900/50 p-4 transition-all duration-100 hover:border-zinc-700 active:scale-95"
        {...props}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {issue.issue.urgent ? <AlertTriangle className="size-5 text-red-400" /> : <AlertCircle className="size-5 text-amber-400" />}
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
                  <Check className="h-5 w-5 text-emerald-400" />
                  <span>
                    Resolved {resolutionDaysAgo === 0 ? "today" : resolutionDaysAgo === 1 ? "yesterday" : `${resolutionDaysAgo} days ago`}
                  </span>
                  <span className="text-zinc-700">•</span>
                  <span>by {issue.resolution.resolvedBy.split("@")[0]}</span>
                </div>
              )}

              <div className="flex items-center gap-1 text-sm">
                <Flag className="h-5 w-5 text-indigo-300" />
                <span>Reported {daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`}</span>
                <span className="text-zinc-700">•</span>
                <span>by {issue.issue.reportedBy.split("@")[0]}</span>
              </div>

              {issue.edited && (
                <div className="flex items-center gap-1 text-sm">
                  <UserPen className="h-5 w-5 text-neutral-400" />
                  <span>Edited {editDaysAgo === 0 ? "today" : editDaysAgo === 1 ? "yesterday" : `${editDaysAgo} days ago`}</span>
                  <span className="text-zinc-700">•</span>
                  <span>by {issue.edited.editedBy.split("@")[0]}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }
);
