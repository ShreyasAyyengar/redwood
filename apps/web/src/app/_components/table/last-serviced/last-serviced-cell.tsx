import type { classroomSchema } from "@redwood/contracts";
import { cn } from "@redwood/shad-ui/lib/utils";
import type { Row } from "@tanstack/react-table";
import type { z } from "zod";
import { monthNames, nth } from "../../../../util/date-time-utils";
import { urgencyStyle } from "../../../../util/style-util";

export default function LastServicedCell({ row }: { row: Row<z.infer<typeof classroomSchema>> }) {
  const lastMaintenance = row.original.lastMaintenance;
  if (!lastMaintenance) return <div className="text-center text-foreground text-lg">No Record Yet</div>;

  const date = new Date(lastMaintenance.date);

  const month = date.getMonth();
  const monthName = monthNames[month];
  const day = date.getDate();
  const dayEnding = nth(day);

  const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex flex-col">
      <div className="mt-1 flex items-center justify-center">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-lg",
            // daysAgo <= 14 && "bg-[#2b462f] text-[#B4F7AB]",
            // daysAgo > 14 && daysAgo <= 30 && "bg-[#463a2b] text-[#FCD34D]",
            // daysAgo > 21 && "bg-[#5a1f24] text-[#FCA5A5]"
            daysAgo <= 14 && urgencyStyle("green"),
            daysAgo > 14 && daysAgo <= 21 && urgencyStyle("orange"),
            daysAgo > 21 && urgencyStyle("red")
          )}
        >
          {`${daysAgo} day${daysAgo === 1 ? "" : "s"} ago • ${daysAgo <= 14 ? "Up to Date" : daysAgo <= 21 ? "Pending" : "Overdue"}`}
        </span>
      </div>

      <div
        // under 14, green, between 14 and 21, orange, over 21, red
        className={cn("mt-1 text-center")}
      >
        {`${monthName} ${day}${dayEnding} ${daysAgo > 0 ? `• ${lastMaintenance.by.split("@")[0]}` : ""}`}
      </div>
    </div>
  );
}
