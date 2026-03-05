import type { classroomSchema } from "@redwood/contracts";
import { cn } from "@redwood/shad-ui/lib/utils";
import { Bug, Building2, Info, SquareCheckBig, Wrench } from "lucide-react";
import type { z } from "zod";
import { monthNames, nth } from "../../../../util/date-time-utils";
import { urgencyStyle } from "../../../../util/style-util";

export default function RoomSummary({
  room,
  issueCount,
  taskCount,
}: {
  room: z.infer<typeof classroomSchema>;
  issueCount: number;
  taskCount: number;
}) {
  let lastServiced: string | undefined;
  let lastServicedDaysAgo: number | undefined;
  if (room.lastMaintenance) {
    const date = new Date(room.lastMaintenance.date);
    const monthName = monthNames[date.getMonth()];
    const day = date.getDate();
    const dayEnding = nth(day);
    lastServiced = `${monthName} ${day}${dayEnding}`;
    lastServicedDaysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  const roomStateBadge = (
    <div
      className={cn(
        "rounded-2xl px-2 text-center font-bold font-mono text-sm",
        room.roomStatus === "GOOD" && urgencyStyle("green"),
        room.roomStatus === "NEEDS ATTENTION" && urgencyStyle("orange"),
        room.roomStatus === "NEEDS URGENT ATTENTION" && urgencyStyle("red")
      )}
    >
      {room.roomStatus}
    </div>
  );

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl p-5 font-bold text-3xl text-zinc-300/80 shadow-xl/80",
        room.roomStatus === "GOOD" && "bg-green-500/10",
        room.roomStatus === "NEEDS ATTENTION" && "bg-yellow-500/10",
        room.roomStatus === "NEEDS URGENT ATTENTION" && "bg-red-500/10"
      )}
    >
      {room.displayName}

      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5" />
        <div className="mt-2 flex flex-col">
          <div className="flex items-center font-bold text-neutral-400 text-sm">Building Group</div>
          <div className="flex items-center font-normal text-sm text-white/80">{room.groupKey}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Wrench className="h-5 w-5" />
        <div className="mt-2 flex flex-col">
          <div className="flex items-center font-bold text-neutral-400 text-sm">Last Serviced</div>
          <div className="flex items-center font-normal text-sm text-white/80">
            <div className="flex gap-1">
              {lastServiced &&
                `${lastServiced} ${lastServicedDaysAgo && `• ${lastServicedDaysAgo} day${lastServicedDaysAgo === 1 ? "" : "s"} ago`}`}
              {!lastServiced && "No Record Yet"}
              {lastServiced && <div className="flex items-center text-sm">• {room.lastMaintenance?.by.split("@")[0]}</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Info className="h-5 w-5" />
        <div className="flex gap-2">
          <div className="flex font-bold text-neutral-400 text-sm">Classroom Status</div>
          <div className="flex font-normal text-sm text-white/80">{roomStateBadge}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Bug className="h-5 w-5" />
        <div className="mt-2 flex flex-col">
          <div className="flex items-center font-bold text-neutral-400 text-sm">Active Issues</div>
          <div className="flex items-center font-normal text-sm text-white/80">
            {issueCount} issue{issueCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SquareCheckBig className="h-5 w-5" />
        <div className="mt-2 flex flex-col">
          <div className="flex items-center font-bold text-neutral-400 text-sm">Open Tasks</div>
          <div className="flex items-center font-normal text-sm text-white/80">
            {taskCount} task{taskCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div
        className="mt-5 flex w-fit items-center self-center rounded-md bg-neutral-300 px-2 py-1 text-center font-semibold text-black text-lg transition-all duration-150 hover:bg-neutral-400 active:scale-95 active:transform"
        onClick={() => alert("Perform Maintenance")}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            alert("Perform Maintenance");
          }
        }}
      >
        <Wrench className="mr-2 h-5 w-5" />
        Perform Maintenance
      </div>

      {/* TODO: open dialog */}
    </div>
  );
}
