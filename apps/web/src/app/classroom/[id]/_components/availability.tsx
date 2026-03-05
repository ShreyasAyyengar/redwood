import type { classroomSchema } from "@redwood/contracts";
import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@redwood/shad-ui/components/tabs";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useState } from "react";
import type { z } from "zod";
import { convertMinutesToReadable } from "../../../../util/date-time-utils";

const SHORT_BREAK_MINUTES = 15;

export default function Availability({ room }: { room: z.infer<typeof classroomSchema> }) {
  // get short break preference from local storage
  const storedOmitShortBreaks = localStorage.getItem("omittingShortBreaks");
  const [omitShortBreaks, setOmitShortBreaks] = useState(storedOmitShortBreaks === "true" || false);

  const dayToday = new Date().getDay();
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  const todayName = dayNames[dayToday];

  const schedule = room.schedule ?? {};
  const getBlocks = (day: (typeof dayNames)[number]) => (schedule as any)[day] ?? [];

  const durationLabel = (start: number, end: number) => {
    const mins = Math.max(0, end - start);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  // TODO add scroll indicator for availability
  return (
    <div className="flex flex-1 flex-col overflow-hidden border border-zinc-800 bg-zinc-900/50 p-5 font-bold text-xl text-zinc-300/80 sm:text-2xl">
      <div>Availability</div>

      <Tabs defaultValue={todayName} orientation="vertical" className="mt-3 flex min-h-0 flex-1 gap-4">
        {/* Left rail */}
        <TabsList className="h-full! rounded-xl border bg-zinc-950/40">
          {dayNames.map((day) => (
            <TabsTrigger
              key={day}
              value={day}
              className={cn(
                "justify-start capitalize",
                "rounded-lg px-3 py-2 font-semibold text-sm text-zinc-300/80",
                "data-[state=active]:bg-white/10 data-[state=active]:text-zinc-100",
                "hover:bg-white/5"
              )}
            >
              {day}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Right side MUST match TabsList height */}
        <div className="min-h-0 flex-1">
          {dayNames.map((day) => {
            const blocks = getBlocks(day);

            return (
              // TabsContent must be h-full to match parent
              <TabsContent key={day} value={day} className="m-0 h-full">
                <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/30">
                  {/* header stays fixed */}
                  <div className="flex shrink-0 items-center justify-between border-zinc-800 border-b px-4 py-3">
                    <div className="flex items-center gap-5">
                      <div className="font-bold text-base text-zinc-200/90 sm:text-lg">{day[0]!.toUpperCase() + day.slice(1)}</div>
                      <div className="flex items-center gap-2">
                        <div
                          className="flex cursor-pointer items-center gap-1"
                          onClick={() => setOmitShortBreaks(!omitShortBreaks)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              setOmitShortBreaks(!omitShortBreaks);
                            }
                          }}
                        >
                          <Checkbox
                            id="terms-checkbox"
                            name="terms-checkbox"
                            checked={omitShortBreaks}
                            onCheckedChange={(checked) => {
                              setOmitShortBreaks(!!checked);
                              localStorage.setItem("omittingShortBreaks", checked ? "true" : "false");
                            }}
                          />
                          <span
                            className={cn(
                              "font-normal text-sm text-zinc-400 transition-all duration-150",
                              omitShortBreaks && "font-bold text-zinc-300"
                            )}
                          >
                            Omit short breaks
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="font-mono text-xs text-zinc-400">
                      {blocks.length ? `${blocks.length} block${blocks.length === 1 ? "" : "s"}` : "No blocks"}
                    </div>
                  </div>

                  {/* ONLY scroller - takes remaining space */}
                  <ScrollArea className="mb-2 h-full min-h-0 flex-1">
                    <div className="p-3">
                      {blocks.length === 0 ? (
                        <div className="rounded-lg border border-zinc-800 border-dashed bg-zinc-950/20 p-4 font-medium text-sm text-zinc-400">
                          No availability for this day.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {blocks.map((block: any, id: number) => {
                            const start = block.startTimeMin;
                            const end = block.endTimeMin;
                            const duration = omitShortBreaks && end - start < 60 ? 0 : end - start;
                            if (duration < SHORT_BREAK_MINUTES) return null;

                            return (
                              <div
                                key={id}
                                className={cn(
                                  "group relative overflow-hidden rounded-lg border border-white/5 bg-zinc-800/40 px-3 py-2",
                                  "transition hover:border-white/10 hover:bg-zinc-900/60"
                                )}
                              >
                                <div className="absolute inset-y-0 left-0 w-1 bg-white/10 group-hover:bg-white/15" />

                                <div className="flex items-center justify-between gap-3 pl-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm text-zinc-100/90">{convertMinutesToReadable(start)}</span>
                                    <span className="text-zinc-500">→</span>
                                    <span className="font-mono text-sm text-zinc-100/90">{convertMinutesToReadable(end)}</span>
                                  </div>

                                  <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-zinc-300/80">
                                    {durationLabel(start, end)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            );
          })}
        </div>
      </Tabs>
    </div>
  );
}
