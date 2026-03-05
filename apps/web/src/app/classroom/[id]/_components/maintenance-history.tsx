import type { maintenanceEntrySchema } from "@redwood/contracts";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@redwood/shad-ui/components/tooltip";
import { cn } from "@redwood/shad-ui/lib/utils";
import type { z } from "zod";
import { monthNames, nth } from "../../../../util/date-time-utils";

export default function MaintenanceHistory({ history }: { history?: z.infer<typeof maintenanceEntrySchema>[] }) {
  return (
    <div className="flex w-1 flex-1 flex-col overflow-hidden rounded-2xl bg-[#0a0521] p-5 font-bold text-xl text-zinc-300/80 shadow-xl/80 sm:text-2xl">
      <div>Maintenance History</div>

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
                        "group relative cursor-pointer overflow-hidden rounded-xl border border-white/5 bg-[#120040]/70 px-3 py-2",
                        "shadow-sm transition",
                        "hover:border-white/10 hover:bg-[#120040]/90"
                      )}
                    >
                      {/* subtle left accent */}
                      <div className="absolute inset-y-0 left-0 w-1 bg-white/10 group-hover:bg-white/15" />

                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold text-lg text-zinc-100/90">
                          {monthName} {day}
                          {dayEnding}
                        </div>
                      </div>

                      {/* Who (tertiary) */}
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-zinc-400/90 sm:text-sm">
                        <span className="inline-flex h-5 items-center rounded-md bg-white/5 px-2 font-mono text-zinc-300/90">{who}</span>
                        <span className="text-zinc-500/80">completed maintenance</span>
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
