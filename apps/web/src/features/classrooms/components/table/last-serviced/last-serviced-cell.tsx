import { cn } from "@redwood/shad-ui/lib/utils";
import type { LegacyRow as Row } from "@tanstack/react-table/legacy";
import { daysAgoNumeric, formatDate, getDateTimeDisplay } from "#/util/date-time-utils.ts";
import { urgencyStyle } from "#/util/style-util.ts";
import type { ClassroomSummary } from "../../../model/classroom-types";

export default function LastServicedCell({ row }: { row: Row<ClassroomSummary> }) {
  const { lastMaintenance } = row.original;
  if (!lastMaintenance) return <div className="text-center text-foreground text-lg">No Record Yet</div>;

  const date = new Date(lastMaintenance.date);
  const formatDateShort = formatDate(date);

  const daysAgo = daysAgoNumeric(date);

  const { dateDaysAgo } = getDateTimeDisplay(date);

  return (
    <div className="flex flex-col">
      <div className="mt-1 flex items-center justify-center">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-lg",
            // under 14, green, between 14 and 21, orange, over 21, red
            daysAgo < 14 && urgencyStyle("green"),
            daysAgo >= 14 && daysAgo <= 30 && urgencyStyle("orange"),
            daysAgo > 30 && urgencyStyle("red")
          )}
        >
          <span className="capitalize">{dateDaysAgo}</span>
          {` • ${daysAgo < 14 ? "Up to Date" : daysAgo <= 30 ? "Pending" : "Overdue"}`}
        </span>
      </div>

      <div className={cn("mt-1 text-center")}>{`${formatDateShort} • ${lastMaintenance.by.split("@")[0]}`}</div>
    </div>
  );
}
