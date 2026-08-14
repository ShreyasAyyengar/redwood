import { api } from "@backend/convex/_generated/api";
import type { Doc } from "@backend/convex/_generated/dataModel";
import { Button } from "@redwood/shad-ui/components/button";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useQuery } from "convex/react";
import { BookAlert, Plus, TriangleAlert } from "lucide-react";
import { isActiveIssue, sortActiveIssues } from "../model/issue-state";
import { IssueCard, IssueCardSkeleton } from "./cards/issue-card";
import { ClassroomIssueHistoryDialog } from "./dialogs/classroom-issue-history-dialog";
import { IssueDialog } from "./dialogs/issue-dialog";

export default function ActiveIssuesPanel({ room }: { room: Pick<Doc<"classrooms">, "_id" | "displayName"> | undefined }) {
  const issues = useQuery(api.core.issues.service.getClassroomIssues, room ? { classroomId: room._id } : "skip");

  if (!issues || !room) return <ActiveIssuesSkeleton />;

  const openIssues = sortActiveIssues(issues.filter(isActiveIssue));
  return (
    <div className="group relative flex h-full flex-1">
      {/* gradient blur background */}
      {openIssues.some((issue) => issue.issue.urgent) && (
        <div className="absolute inset-0 flex h-full flex-1 scale-102 rounded-2xl bg-red-800 opacity-50 blur-md transition duration-1000 group-hover:opacity-75 group-hover:duration-200" />
      )}

      {/* actual content - now with 'relative' to sit above the blur */}
      <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden rounded-2xl bg-neutral-900/95 p-5 font-bold text-xl text-zinc-300/80 shadow-xl/50 sm:text-2xl">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <TriangleAlert className="size-6 text-yellow-500" />
              <div>Active Issues</div>
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
            </div>

            <ClassroomIssueHistoryDialog classroomId={room._id} title={`Issue History: ${room.displayName}`}>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-3 font-normal transition-colors hover:text-neutral-200 sm:text-lg"
              >
                <BookAlert className="size-5" />
                <span className="font-normal text-md">See Issue History</span>
              </button>
            </ClassroomIssueHistoryDialog>
          </div>

          <IssueDialog roomId={room._id}>
            <Button className="flex w-fit items-center rounded-md bg-neutral-300 px-2 py-1 text-center font-semibold text-black text-lg transition-all duration-150 hover:bg-neutral-400 focus:ring-5! focus:ring-neutral-600! active:scale-95 active:transform">
              <Plus className="size-5" />
              New Issue
            </Button>
          </IssueDialog>
        </div>

        {openIssues.length > 0 ? (
          <ScrollArea className="mt-5 h-full min-h-0 flex-1 overflow-auto rounded-2xl bg-zinc-950/50 p-3">
            {openIssues.map((issue) => (
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

export function ActiveIssuesSkeleton() {
  return (
    <div className="group relative flex h-full flex-1">
      <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden rounded-2xl bg-neutral-900/95 p-5 font-bold text-xl text-zinc-300/80 shadow-xl/50 sm:text-2xl">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <TriangleAlert className="size-6 text-yellow-500" />
              <div>Active Issues</div>

              {/* issue count */}
              <span className="flex h-6 w-6 animate-pulse items-center justify-center rounded-full bg-zinc-700/50" />
            </div>

            <button type="button" disabled className="flex w-full items-center gap-3 font-normal text-zinc-300/80 sm:text-lg">
              <BookAlert className="size-5" />
              <span className="font-normal text-md">See Issue History</span>
            </button>
          </div>

          <Button
            disabled
            className="flex w-fit items-center rounded-md bg-neutral-300 px-2 py-1 text-center font-semibold text-black text-lg transition-all duration-150 hover:bg-neutral-400 focus:ring-5! focus:ring-neutral-600! active:scale-95 active:transform"
          >
            <Plus className="size-5" />
            New Issue
          </Button>
        </div>

        <ScrollArea className="mt-5 h-full min-h-0 flex-1 overflow-auto rounded-2xl bg-zinc-950/50 p-3">
          <div className="space-y-2">
            {Array.from({ length: 3 }).map(() => (
              <IssueCardSkeleton key={crypto.randomUUID()} />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
