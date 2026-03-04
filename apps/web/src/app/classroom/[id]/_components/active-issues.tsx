import type { issueSchema } from "@redwood/contracts";
import { cn } from "@redwood/shad-ui/lib/utils";
import { BookAlert } from "lucide-react";
import type { z } from "zod";

export default function ActiveIssues({ issues }: { issues?: z.infer<typeof issueSchema>[] }) {
  return (
    <div className="flex min-h-0 w-auto flex-1 flex-col overflow-hidden rounded-2xl bg-zinc-800 p-5 font-bold text-xl text-zinc-300/80 shadow-xl/50 sm:text-2xl">
      <div>Active Issues</div>
      <button
        type="button"
        className="mt-1 flex w-full cursor-pointer items-center gap-2 font-normal transition-colors hover:text-neutral-200 sm:text-lg"
      >
        <span className="font-normal text-sm">See Issue History</span>
        {/* TODO open dialog */}
        <BookAlert className="h-5 w-5" />
      </button>

      <div className="mt-1">
        {issues?.map((issue) => (
          <div
            key={issue._id}
            className={cn("relative flex flex-col gap-1 p-2", issue.issue.urgent && "border border-red-500/10 bg-red-500/10")}
          >
            <span className={cn("w-fit rounded-2xl px-2 font-bold font-mono text-lg", issue.issue.urgent && "bg-red-500/10 text-red-500")}>
              {issue.issue.urgent ? "Urgent" : ""}
            </span>
            <span className="p-2 font-bold text-base">{issue.issue.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
