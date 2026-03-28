import type { classroomSchema, issueSchema } from "@redwood/contracts";
import { Badge } from "@redwood/shad-ui/components/badge";
import { Card } from "@redwood/shad-ui/components/card";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { cn } from "@redwood/shad-ui/lib/utils";
import { AlertCircle, AlertTriangle, BookAlert, Plus, TriangleAlert } from "lucide-react";
import type { z } from "zod";
import { daysAgo as daysAgoUtil } from "../../../../util/date-time-utils";
import { urgencyStyle } from "../../../../util/style-util";
import { NewIssueDialog } from "./new-issue-dialog";

export default function ActiveIssues({
  issues,
  roomId,
}: {
  issues?: z.infer<typeof issueSchema>[];
  roomId: z.infer<typeof classroomSchema>["_id"];
}) {
  const openIssues = issues?.filter((issue) => !issue.resolution);

  return (
    <div className="group relative flex h-full flex-1">
      {/* gradient blur background */}
      {openIssues && openIssues.filter((issue) => issue.issue.urgent).length > 0 && (
        <div className="absolute inset-0 flex h-full flex-1 scale-102 rounded-2xl bg-red-800 opacity-50 blur-md transition duration-1000 group-hover:opacity-75 group-hover:duration-200" />
      )}

      {/* actual content - now with 'relative' to sit above the blur */}
      <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden rounded-2xl bg-zinc-900 p-5 font-bold text-xl text-zinc-300/80 shadow-xl/50 sm:text-2xl">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <TriangleAlert className="h-6 w-6 text-yellow-500" />
              <div>Active Issues</div>
              {openIssues && (
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-sm transition-all duration-100",
                    openIssues.length > 0
                      ? "border-yellow-500/30 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
                      : "border-zinc-500/30 bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30"
                  )}
                >
                  {openIssues.length}
                </span>
              )}
            </div>

            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-3 font-normal transition-colors hover:text-neutral-200 sm:text-lg"
            >
              <BookAlert className="h-5 w-5" />
              <span className="font-normal text-md">See Issue History</span>
              {/* TODO open dialog */}
            </button>
          </div>

          <NewIssueDialog roomId={roomId}>
            <div className="flex w-fit items-center rounded-md bg-neutral-300 px-2 py-1 text-center font-semibold text-black text-lg transition-all duration-150 hover:bg-neutral-400 active:scale-95 active:transform">
              <Plus className="mr-2 h-5 w-5" />
              New Issue
            </div>
          </NewIssueDialog>
        </div>

        {openIssues && openIssues.length > 0 ? (
          <ScrollArea className="mt-5 h-full min-h-0 flex-1 overflow-auto rounded-2xl bg-zinc-950/50 p-3">
            {openIssues?.map((issue) => {
              const daysAgo = daysAgoUtil(new Date(issue.issue.issueDate));
              const daysAgoStr = daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`;

              return (
                <NewIssueDialog key={issue._id} roomId={roomId} existingIssue={issue}>
                  <Card
                    key={issue._id}
                    className="my-1 border-zinc-800 bg-zinc-900/50 p-4 transition-all duration-100 hover:border-zinc-700 active:scale-95"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {issue.issue.urgent ? (
                          <AlertTriangle className="size-5 text-red-400" />
                        ) : (
                          <AlertCircle className="size-5 text-amber-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/*<div className="mb-2 flex flex-col items-start justify-between gap-2 lg:flex-row">*/}
                        <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                          <p className="flex-1 font-normal text-sm text-zinc-200">{issue.issue.description}</p>
                          <div className="flex shrink-0 gap-1.5">
                            {issue.issue.urgent && (
                              <Badge variant="outline" className={urgencyStyle("red")}>
                                Urgent
                              </Badge>
                            )}
                            {issue.issue.supervisorNeeded && (
                              <Badge variant="outline" className="border-purple-500/30 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30">
                                Supervisor Needed
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <span>Reported {daysAgoStr}</span>
                          <span className="text-zinc-700">•</span>
                          <span>by {issue.issue.reportedBy.split("@")[0]}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </NewIssueDialog>
              );
            })}
          </ScrollArea>
        ) : (
          <div className="flex flex-1 items-center justify-center font-semibold text-3xl text-zinc-300">
            <span className="rounded-md bg-zinc-950/85 p-5">No Active Issues!</span>
          </div>
        )}
      </div>
    </div>
  );
}
