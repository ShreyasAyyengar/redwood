import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { cn } from "@redwood/shad-ui/lib/utils";
import type { RefObject } from "react";
import type { Issue } from "../../model/issue-state";

export function MiniIssueCard({
  issue,
  ref,
  ...props
}: { issue: Issue } & React.HTMLAttributes<HTMLDivElement> & { ref?: RefObject<HTMLDivElement | null> }) {
  const priorityAccentClassName = issue.issue.urgent ? "bg-red-500" : "bg-amber-400";
  const supervisorAccentClassName = issue.issue.supervisorNeeded ? "bg-purple-500" : priorityAccentClassName;

  return (
    <div
      ref={ref}
      className="flex w-72 cursor-pointer flex-row overflow-hidden rounded-md border border-zinc-800/80 bg-zinc-950/70 shadow-sm transition-colors hover:border-zinc-700 hover:bg-zinc-950"
      {...props}
    >
      <div className="flex w-1.5 shrink-0 flex-col" aria-hidden="true">
        <div className={cn("h-1/2", priorityAccentClassName)} />
        <div className={cn("h-1/2", supervisorAccentClassName)} />
      </div>
      <ScrollArea className="max-h-16 min-h-14 flex-1">
        <p className="whitespace-pre-wrap px-3 py-2 text-left text-sm text-zinc-200 leading-snug">{issue.issue.description}</p>
      </ScrollArea>
    </div>
  );
}
