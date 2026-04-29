import type { classroomSchemaPayload } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@redwood/shad-ui/components/tooltip";
import { cn } from "@redwood/shad-ui/lib/utils";
import { Bug, Building2, Info, SquareCheckBig, Wrench } from "lucide-react";
import type { z } from "zod";
import { daysAgoRelative, formatDateAbsolute } from "../../../../util/date-time-utils";
import { urgencyStyle } from "../../../../util/style-util";
import MaintenanceDialog from "./maintenance/maintenance-dialog";

type LastServiced = {
  lastServicedAbsolute: string;
  lastServicedDaysAgo: string;
} | null;

export default function RoomSummary({ room }: { room: z.infer<typeof classroomSchemaPayload> | undefined }) {
  if (!room) return <RoomSummarySkeleton />;

  let lastServiced: LastServiced = null;

  if (room.lastMaintenance) {
    const date = new Date(room.lastMaintenance.date);
    lastServiced = {
      lastServicedAbsolute: formatDateAbsolute(date),
      lastServicedDaysAgo: daysAgoRelative(date),
    };
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
        "flex flex-col rounded-2xl p-5 pt-3 font-bold text-2xl text-zinc-300/80 shadow-xl/80",
        room.roomStatus === "GOOD" && "bg-green-500/10",
        room.roomStatus === "NEEDS ATTENTION" && "bg-yellow-500/10",
        room.roomStatus === "NEEDS URGENT ATTENTION" && "bg-red-500/10"
      )}
    >
      {room.displayName}

      <div className="flex items-center gap-2">
        <Building2 className="size-5" />
        <div className="mt-2 flex flex-col">
          <div className="flex items-center font-bold text-neutral-400 text-sm">Building Group</div>
          <div className="flex items-center font-normal text-sm text-white/80">{room.groupKey}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Wrench className="size-5" />
        <div className="mt-2 flex flex-col">
          <div className="flex items-center font-bold text-neutral-400 text-sm">Last Serviced</div>
          <div className="flex items-center font-normal text-sm text-white/80">
            <div className="flex gap-1">
              {!lastServiced && "No Record Yet"}
              {lastServiced && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="flex items-center text-sm capitalize">{lastServiced.lastServicedDaysAgo}</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-900 fill-zinc-900" tooltipArrowClassName="bg-zinc-900 fill-zinc-900">
                      <p className="font-bold text-neutral-300 text-sm">{lastServiced.lastServicedAbsolute}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {lastServiced && <div className="flex items-center text-sm">• {room.lastMaintenance?.by.split("@")[0]}</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Info className="size-5" />
        <div className="flex flex-col">
          <div className="flex font-bold text-neutral-400 text-sm">Classroom Status</div>
          <div className="flex font-normal text-sm text-white/80">{roomStateBadge}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Bug className="size-5" />
        <div className="mt-2 flex flex-col">
          <div className="flex items-center font-bold text-neutral-400 text-sm">Active Issues</div>
          <div className="flex items-center font-normal text-sm text-white/80">
            {room.activeIssuesCount} issue{room.activeIssuesCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SquareCheckBig className="size-5" />
        <div className="mt-2 flex flex-col">
          <div className="flex items-center font-bold text-neutral-400 text-sm">Open Tasks</div>
          <div className="flex items-center font-normal text-sm text-white/80">
            {room.openTasksCount} task{room.openTasksCount !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <div className="flex justify-start lg:justify-center">
        <MaintenanceDialog roomId={room._id}>
          <Button className="mt-4 flex w-fit items-center rounded-md bg-neutral-300 px-2 py-0.5 text-center font-semibold text-base text-black transition-all duration-150 hover:bg-neutral-400 focus:ring-5! focus:ring-neutral-600! active:scale-95 active:transform">
            <Wrench className="size-5" />
            Perform Maintenance
          </Button>
        </MaintenanceDialog>
      </div>
    </div>
  );
}

export function RoomSummarySkeleton() {
  return (
    <div className="flex flex-col rounded-2xl bg-neutral-800/50 p-5 pt-3 font-bold text-2xl text-zinc-300/80 shadow-xl/80">
      {/* Room Name */}
      <div className="mb-2 h-7 w-60 animate-pulse rounded bg-neutral-700/50" />

      {/* Building Group */}
      <div className="flex items-center gap-2">
        <Building2 className="size-5 opacity-70" />
        <div className="mt-2 flex flex-col">
          <div className="font-bold text-neutral-400 text-sm">Building Group</div>
          <div className="mt-1 h-4 w-24 animate-pulse rounded bg-neutral-700/50" />
        </div>
      </div>

      {/* Last Serviced */}
      <div className="flex items-center gap-2">
        <Wrench className="size-5 opacity-70" />
        <div className="mt-2 flex flex-col">
          <div className="font-bold text-neutral-400 text-sm">Last Serviced</div>
          <div className="mt-1 flex items-center gap-1">
            <div className="h-4 w-20 animate-pulse rounded bg-neutral-700/50" />
            <span className="text-sm">•</span>
            <div className="h-4 w-12 animate-pulse rounded bg-neutral-700/50" />
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="mt-2 flex items-center gap-2">
        <Info className="size-5 opacity-70" />
        <div className="flex flex-col">
          <div className="font-bold text-neutral-400 text-sm">Classroom Status</div>
          <div className="h-5 w-28 animate-pulse rounded-2xl bg-neutral-700/50" />
        </div>
      </div>

      {/* Issues */}
      <div className="flex items-center gap-2">
        <Bug className="size-5 opacity-70" />
        <div className="mt-2 flex flex-col">
          <div className="font-bold text-neutral-400 text-sm">Active Issues</div>
          <div className="mt-1 h-4 w-16 animate-pulse rounded bg-neutral-700/50" />
        </div>
      </div>

      {/* Tasks */}
      <div className="flex items-center gap-2">
        <SquareCheckBig className="size-5 opacity-70" />
        <div className="mt-2 flex flex-col">
          <div className="font-bold text-neutral-400 text-sm">Open Tasks</div>
          <div className="mt-1 h-4 w-16 animate-pulse rounded bg-neutral-700/50" />
        </div>
      </div>

      {/* Button */}
      <div className="flex justify-start lg:justify-center">
        <Button
          disabled
          className="mt-4 flex w-fit items-center rounded-md bg-neutral-300 px-2 py-0.5 text-center font-semibold text-base text-black transition-all duration-150 hover:bg-neutral-400 focus:ring-5! focus:ring-neutral-600! active:scale-95 active:transform"
        >
          <Wrench className="size-5" />
          Perform Maintenance
        </Button>
      </div>
    </div>
  );
}
