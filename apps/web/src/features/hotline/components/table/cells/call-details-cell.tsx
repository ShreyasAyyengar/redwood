import type { Doc } from "@backend/convex/_generated/dataModel";
import { CalendarDays, UserRound } from "lucide-react";

export function CallDetailsCell({ entry }: { entry: Doc<"hotline"> }) {
  const date = new Date(entry.dateOfCall);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-start gap-2 font-semibold text-sm text-zinc-100">
        <CalendarDays className="mt-0.5 size-4 shrink-0 text-sky-400" />
        <span className="flex flex-col leading-5">
          <span>{formattedDate}</span>
          <span className="text-zinc-400">{formattedTime}</span>
        </span>
      </div>
      <div className="flex items-center gap-2 pl-0.5 text-xs text-zinc-500">
        <UserRound className="size-3.5 shrink-0" />
        <span className="break-all">{entry.takenBy.split("@")[0]}</span>
      </div>
    </div>
  );
}
