import type { classroomSchema } from "@redwood/contracts";
import { cn } from "@redwood/shad-ui/lib/utils";
import type { Row } from "@tanstack/react-table";
import type { z } from "zod";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const endings = ["st", "nd", "rd", "th"];

const nth = (d: number) => {
  if (d > 3 && d < 21) return "th";
  switch (d % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

export default function LastServicedCell({ row }: { row: Row<z.infer<typeof classroomSchema>> }) {
  const lastMaintenance = row.original.lastMaintenance;
  if (!lastMaintenance) return <div className="text-center text-indigo-400 text-lg">No Record Yet</div>;

  const date = new Date(lastMaintenance.date);

  const month = date.getMonth();
  const monthName = monthNames[month];
  const day = date.getDate();
  const dayEnding = nth(day);

  const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="flex flex-col">
      <div
        // under 14, green, between 14 and 21, orange, over 21, red
        className={cn("text-center text-lg")}
      >
        {`${monthName} ${day}${dayEnding} ${daysAgo > 0 ? `• ${lastMaintenance.by.split("@")[0]}` : ""}`}
      </div>
      <div className="mt-2 flex items-center justify-center gap-1">
        <div className="text-center text-neutral-400 text-sm">{daysAgo} days ago •</div>
        <div className="text-center text-neutral-400 text-sm">
          {daysAgo <= 14 && <span className="text rounded-full bg-[#2b462f] px-2 py-0.5 text-foreground">Up to Date</span>}
          {daysAgo > 14 && daysAgo <= 21 && <span className="text rounded-full bg-[#5a442e] px-2 py-0.5 text-foreground">Needs Attention</span>}
          {daysAgo > 21 && <span className="text rounded-full bg-[#6A242A] px-2 py-0.5 text-foreground">Overdue</span>}
        </div>
      </div>
    </div>
  );
}
