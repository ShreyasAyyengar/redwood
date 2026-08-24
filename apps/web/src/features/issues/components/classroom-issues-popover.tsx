"use client";

import { api } from "@backend/convex/_generated/api";
import type { Id } from "@backend/convex/_generated/dataModel";
import { Popover, PopoverContent, PopoverTrigger } from "@redwood/shad-ui/components/popover";
import { useQuery } from "convex/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { isActiveIssue } from "../model/issue-state";
import { MiniIssueCard } from "./cards/mini-issue-card";
import { IssueDialog } from "./dialogs/issue-dialog";

export function ClassroomIssuesPopover({ classroomId, children }: { classroomId: Id<"classrooms">; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const issues = useQuery(api.core.issues.service.getClassroomIssues, open ? { classroomId } : "skip");
  const activeIssues = issues?.filter(isActiveIssue) ?? [];

  const holdCount = issues?.filter((issue) => issue.issue.onHold).length ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="top"
        className="flex w-80 flex-col items-stretch gap-2 border-zinc-800 bg-zinc-900 p-3"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-center font-bold text-sm text-zinc-100">Issues</span>
          <IssueDialog roomId={classroomId}>
            <div className="rounded-md bg-white px-1 text-black transition-all duration-100 active:scale-95 active:transform">
              <Plus className="size-5" />
            </div>
          </IssueDialog>
        </div>

        {issues === undefined ? (
          <span className="py-2 text-center text-sm text-zinc-500">Loading issues...</span>
        ) : activeIssues.length > 0 ? (
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {activeIssues.map((issue) => (
              <IssueDialog key={issue._id} roomId={classroomId} existingIssue={issue}>
                <MiniIssueCard issue={issue} />
              </IssueDialog>
            ))}
          </div>
        ) : (
          <>
            <span className="text-center text-sm text-zinc-500">No active issues</span>
            {holdCount > 0 && (
              <span className="text-center text-xs text-zinc-500">
                There {holdCount === 1 ? "is" : "are"} {holdCount} issue{holdCount === 1 ? "" : "s"} on hold.
              </span>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
