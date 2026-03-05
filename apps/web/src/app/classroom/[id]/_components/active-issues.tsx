import type { issueSchema } from "@redwood/contracts";
import { Badge } from "@redwood/shad-ui/components/badge";
import { Card } from "@redwood/shad-ui/components/card";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { cn } from "@redwood/shad-ui/lib/utils";
import { AlertCircle, AlertTriangle, BookAlert, TriangleAlert } from "lucide-react";
import type { z } from "zod";
import { urgencyStyle } from "../../../../util/style-util";

export default function ActiveIssues({ issues }: { issues?: z.infer<typeof issueSchema>[] }) {
  const openIssues = issues?.filter((issue) => !issue.resolution);

  return (
    <div className="group relative flex min-h-0 flex-1">
      {/* gradient blur background */}
      {openIssues && openIssues.filter((issue) => issue.issue.urgent).length > 0 && (
        <div className="absolute -inset-2 mb-10 flex min-h-0 flex-1 rounded-2xl bg-red-800 opacity-50 blur-md transition duration-1000 group-hover:opacity-75 group-hover:duration-200" />
      )}

      {/* actual content - now with 'relative' to sit above the blur */}
      <div className="relative mb-10 flex min-h-0 w-auto flex-1 flex-col overflow-hidden rounded-2xl bg-zinc-900 p-5 font-bold text-xl text-zinc-300/80 shadow-xl/50 sm:text-2xl">
        <div className="flex items-center gap-2">
          <TriangleAlert className="h-6 w-6 text-yellow-500" />
          <div>Active Issues</div>
          {openIssues && (
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-sm transition-all duration-100",
                openIssues.length > 0
                  ? "border-red-500/30 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "border-zinc-500/30 bg-zinc-500/20 text-zinc-400 hover:bg-zinc-500/30"
              )}
            >
              {openIssues.length}
            </span>
          )}
        </div>

        <button
          type="button"
          className="mt-1 flex w-full cursor-pointer items-center gap-2 font-normal transition-colors hover:text-neutral-200 sm:text-lg"
        >
          <span className="font-normal text-sm">See Issue History</span>
          {/* TODO open dialog */}
          <BookAlert className="h-5 w-5" />
        </button>

        <ScrollArea className="mt-5 min-h-0 flex-1 overflow-auto rounded-2xl bg-zinc-950/50 p-2">
          {openIssues?.map((issue) => (
            <Card key={issue._id} className="mb-3 border-zinc-800 bg-zinc-900/50 p-4 transition-colors hover:border-zinc-700">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {issue.issue.urgent ? <AlertTriangle className="size-5 text-red-400" /> : <AlertCircle className="size-5 text-amber-400" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-start justify-between gap-2">
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

                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span>Reported 5 days ago</span>
                    <span className="text-zinc-700">•</span>
                    <span>by {issue.issue.reportedBy}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
}
