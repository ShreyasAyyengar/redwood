import type { maintenanceEntrySchema } from "@redwood/contracts";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@redwood/shad-ui/components/tooltip";
import { cn } from "@redwood/shad-ui/lib/utils";
import { CalendarDays, ClipboardClock, UserCog } from "lucide-react";
import type { z } from "zod";
import { monthNames, nth } from "../../../../util/date-time-utils";

export default function MaintenanceHistory({ history }: { history?: z.infer<typeof maintenanceEntrySchema>[] }) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-neutral-900/95 p-5 font-bold text-xl text-zinc-300/80 shadow-xl/80 sm:text-2xl">
      <div className="flex items-center">
        <ClipboardClock className="mr-2 h-6 w-6 text-amber-400" />
        <div>Maintenance History</div>
      </div>

      <ScrollArea className="mt-3 h-fit min-h-0">
        <TooltipProvider skipDelayDuration={0}>
          <div className="space-y-2">
            {history?.map((entry) => {
              const date = new Date(entry.date);
              const monthName = monthNames[date.getMonth()];
              const day = date.getDate();
              const dayEnding = nth(day);
              const who = entry.completedBy.split("@")[0];

              return (
                <Tooltip key={entry._id} delayDuration={500}>
                  <TooltipTrigger asChild>
                    <div
                      key={entry._id}
                      className={cn(
                        "group relative cursor-pointer overflow-hidden rounded-xl border border-neutral-700/50 bg-neutral-800/70 px-3 py-2",
                        "shadow-sm transition-all duration-200",
                        "hover:border-amber-500/30 hover:bg-neutral-800/90 hover:shadow-md"
                      )}
                    >
                      {/* subtle left accent */}
                      <div className="absolute inset-y-0 left-0 w-1 bg-amber-500/50 transition-all duration-200 group-hover:bg-amber-400/80" />

                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-6 w-6 text-amber-400" />
                        <div className="font-semibold text-lg text-neutral-100">
                          {monthName} {day}
                          {dayEnding}
                        </div>
                      </div>

                      {/* Who (tertiary) */}
                      <div className="mt-0.5 flex items-center gap-1 text-neutral-400 text-xs sm:text-sm">
                        <UserCog className="h-6 w-6 text-amber-400" />
                        <span className="inline-flex h-5 items-center rounded-md bg-amber-500/15 px-2 font-mono text-amber-300">{who}</span>
                        <span className="text-neutral-500">completed maintenance</span>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="font-bold">View Maintenance Log</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      </ScrollArea>
    </div>
  );
}
