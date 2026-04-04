import type { classroomSchema, issueSchema } from "@redwood/contracts";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { cn } from "@redwood/shad-ui/lib/utils";
import { BookAlert, Plus, TriangleAlert } from "lucide-react";
import type { z } from "zod";
import { IssueCard } from "./issue/issue-card";
import { IssueDialog } from "./issue/issue-dialog";
import IssueHistoryDialog from "./issue/issue-history-dialog";

export default function ActiveIssues({ issues, room }: { issues?: z.infer<typeof issueSchema>[]; room: z.infer<typeof classroomSchema> }) {
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

            <IssueHistoryDialog room={room} issues={issues}>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-3 font-normal transition-colors hover:text-neutral-200 sm:text-lg"
              >
                <BookAlert className="h-5 w-5" />
                <span className="font-normal text-md">See Issue History</span>
              </button>
            </IssueHistoryDialog>
          </div>

          <IssueDialog roomId={room._id}>
            <div className="flex w-fit items-center rounded-md bg-neutral-300 px-2 py-1 text-center font-semibold text-black text-lg transition-all duration-150 hover:bg-neutral-400 active:scale-95 active:transform">
              <Plus className="mr-2 h-5 w-5" />
              New Issue
            </div>
          </IssueDialog>
        </div>

        {openIssues && openIssues.length > 0 ? (
          <ScrollArea className="mt-5 h-full min-h-0 flex-1 overflow-auto rounded-2xl bg-zinc-950/50 p-3">
            {openIssues?.map((issue) => (
              <IssueDialog key={issue._id} roomId={room._id} existingIssue={issue}>
                <IssueCard issue={issue} />
              </IssueDialog>
            ))}
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
