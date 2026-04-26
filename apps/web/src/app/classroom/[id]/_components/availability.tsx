import type { classroomSchema } from "@redwood/contracts";
import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@redwood/shad-ui/components/tabs";
import { cn } from "@redwood/shad-ui/lib/utils";
import { CalendarClock } from "lucide-react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { convertMinutesToReadable } from "../../../../util/date-time-utils";

const SHORT_BREAK_MINUTES = 15;
const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;

// TODO redo
export default function Availability({ room }: { room: z.infer<typeof classroomSchema> }) {
  // get short break preference from local storage
  const storedOmitShortBreaks = localStorage.getItem("omittingShortBreaks");
  const [omitShortBreaks, setOmitShortBreaks] = useState(storedOmitShortBreaks === "true" || false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute to keep the UI fresh
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const dayToday = new Date().getDay();
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

  // Helper to get current time in minutes since midnight
  const getCurrentMinutes = () => {
    const now = currentTime;
    return now.getHours() * 60 + now.getMinutes();
  };

  // Determine block status
  const getBlockStatus = (day: string, startMin: number, endMin: number) => {
    const currentDayIndex = currentTime.getDay();
    const blockDayIndex = dayNames.indexOf(day as any);

    // Only check time status if it's today
    if (currentDayIndex !== blockDayIndex) {
      return "future";
    }

    const currentMinutes = getCurrentMinutes();

    // Block is happening right now
    if (currentMinutes >= startMin && currentMinutes < endMin) {
      return "current";
    }

    // Block is coming up in the next 15 minutes
    if (currentMinutes < startMin && startMin - currentMinutes <= 15) {
      return "upcoming";
    }

    // Block has already passed
    if (currentMinutes >= endMin) {
      return "past";
    }

    return "future";
  };

  // TODO add scroll indicator for availability
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-neutral-900/95 p-5 font-bold text-xl text-zinc-300/80 shadow-xl/80 sm:text-2xl">
      <div className="flex items-center">
        <CalendarClock className="mr-2 h-6 w-6" />
        <div>Availability</div>
      </div>

      {/* Desktop View */}
      <Tabs defaultValue={todayName} orientation="vertical" className="mt-3 hidden min-h-0 flex-1 gap-2 xl:flex">
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

        <div className="min-h-0 flex-1">
          {dayNames.map((day) => {
            const blocks = getBlocks(day);

            return (
              // TabsContent must be h-full to match parent
              <TabsContent key={day} value={day} className="m-0 h-full">
                <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/30">
                  {/* header */}
                  <div className="flex shrink-0 items-center justify-between border-zinc-800 border-b px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <div className="font-bold text-base text-zinc-200/90 sm:text-lg">{day[0]!.toUpperCase() + day.slice(1)}</div>
                      <div className="flex items-center gap-2">
                        <div
                          className="flex cursor-pointer items-center gap-1"
                          onClick={() => {
                            setOmitShortBreaks(!omitShortBreaks);
                            localStorage.setItem("omittingShortBreaks", omitShortBreaks ? "false" : "true");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              setOmitShortBreaks(!omitShortBreaks);
                            }
                          }}
                        >
                          <Checkbox id="terms-checkbox" name="terms-checkbox" checked={omitShortBreaks} className="border border-neutral-400" />
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

                            const status = getBlockStatus(day, start, end);
                            const isPast = status === "past";
                            const isCurrent = status === "current";
                            const isUpcoming = status === "upcoming";
                            const isActive = isCurrent || isUpcoming;

                            return (
                              <div
                                key={id}
                                className={cn(
                                  "group relative overflow-hidden rounded-lg border px-3 py-2",
                                  "transition",
                                  // Past blocks - greyed out
                                  isPast && "border-zinc-800/50 bg-zinc-900/20 opacity-50",
                                  // Current/upcoming blocks - highlighted with shimmy animation
                                  isActive && "animate-shimmy border-emerald-500/40 bg-emerald-950/30",
                                  // Future blocks - normal
                                  !isPast && !isActive && "border-white/5 bg-zinc-800/40 hover:border-white/10 hover:bg-zinc-900/60"
                                )}
                              >
                                {/* Left accent bar */}
                                <div
                                  className={cn(
                                    "absolute inset-y-0 left-0 w-1",
                                    isPast && "bg-zinc-700/30",
                                    isActive && "animate-pulse bg-emerald-500/70",
                                    !isPast && !isActive && "bg-white/10 group-hover:bg-white/15"
                                  )}
                                />

                                <div className="flex items-center justify-between gap-3 pl-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "text-lg",
                                        isPast && "text-zinc-500/70",
                                        isActive && "font-bold text-emerald-100",
                                        !isPast && !isActive && "text-zinc-100/90"
                                      )}
                                    >
                                      {convertMinutesToReadable(start)}
                                    </span>
                                    <span
                                      className={cn(
                                        isPast && "text-zinc-600/50",
                                        isActive && "text-emerald-400",
                                        !isPast && !isActive && "text-zinc-500"
                                      )}
                                    >
                                      →
                                    </span>
                                    <span
                                      className={cn(
                                        "text-lg",
                                        isPast && "text-zinc-500/70",
                                        isActive && "font-bold text-emerald-100",
                                        !isPast && !isActive && "text-zinc-100/90"
                                      )}
                                    >
                                      {convertMinutesToReadable(end)}
                                    </span>
                                  </div>

                                  <div className="flex flex-col items-center gap-2">
                                    {/* Status badge for current/upcoming */}
                                    {isCurrent && (
                                      <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-300 text-xs">NOW</span>
                                    )}
                                    {isUpcoming && (
                                      <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300 text-xs">SOON</span>
                                    )}

                                    <span
                                      className={cn(
                                        "rounded-md px-2 py-0.5 font-mono text-xs",
                                        isPast && "bg-zinc-800/30 text-zinc-500/70",
                                        isActive && "bg-emerald-500/15 text-emerald-300",
                                        !isPast && !isActive && "bg-white/5 text-zinc-300/80"
                                      )}
                                    >
                                      {durationLabel(start, end)}
                                    </span>
                                  </div>
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

      {/* Mobile View */}
      <Tabs defaultValue={todayName} className="mt-3 flex min-h-0 flex-1 flex-col gap-4 xl:hidden">
        {/* Left rail */}
        <TabsList
          className={cn(
            // Mobile/tablet: tabs on top, horizontal scroll if needed
            "mx-auto ml-5 w-full flex-row items-stretch gap-1 overflow-x-auto rounded-xl border bg-zinc-950/40 p-2",
            // Desktop (xl+): tabs on the left, full height
            "xl:h-full xl:w-40 xl:flex-col xl:overflow-visible"
          )}
        >
          {dayNames.map((day) => (
            <TabsTrigger
              key={day}
              value={day}
              className={cn(
                // Mobile: centered pill tabs; Desktop: left-aligned
                "shrink-0 justify-center capitalize xl:justify-start",
                "rounded-lg px-3 py-2 font-semibold text-sm text-zinc-300/80",
                "data-[state=active]:bg-white/10 data-[state=active]:text-zinc-100",
                "hover:bg-white/5"
              )}
            >
              {day}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Content area */}
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
                          className="flex cursor-pointer items-center gap-2"
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
                            className="border border-neutral-400"
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

                            const status = getBlockStatus(day, start, end);
                            const isPast = status === "past";
                            const isCurrent = status === "current";
                            const isUpcoming = status === "upcoming";
                            const isActive = isCurrent || isUpcoming;

                            return (
                              <div
                                key={id}
                                className={cn(
                                  "group relative overflow-hidden rounded-lg border px-3 py-2",
                                  "transition",
                                  // Past blocks - greyed out
                                  isPast && "border-zinc-800/50 bg-zinc-900/20 opacity-50",
                                  // Current/upcoming blocks - highlighted with shimmy animation
                                  isActive && "animate-shimmy border-emerald-500/40 bg-emerald-950/30",
                                  // Future blocks - normal
                                  !isPast && !isActive && "border-white/5 bg-zinc-800/40 hover:border-white/10 hover:bg-zinc-900/60"
                                )}
                              >
                                {/* Left accent bar */}
                                <div
                                  className={cn(
                                    "absolute inset-y-0 left-0 w-1",
                                    isPast && "bg-zinc-700/30",
                                    isActive && "animate-pulse bg-emerald-500/70",
                                    !isPast && !isActive && "bg-white/10 group-hover:bg-white/15"
                                  )}
                                />

                                <div className="flex items-center justify-between gap-3 pl-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "text-lg",
                                        isPast && "text-zinc-500/70",
                                        isActive && "font-bold text-emerald-100",
                                        !isPast && !isActive && "text-zinc-100/90"
                                      )}
                                    >
                                      {convertMinutesToReadable(start)}
                                    </span>
                                    <span
                                      className={cn(
                                        isPast && "text-zinc-600/50",
                                        isActive && "text-emerald-400",
                                        !isPast && !isActive && "text-zinc-500"
                                      )}
                                    >
                                      →
                                    </span>
                                    <span
                                      className={cn(
                                        "text-lg",
                                        isPast && "text-zinc-500/70",
                                        isActive && "font-bold text-emerald-100",
                                        !isPast && !isActive && "text-zinc-100/90"
                                      )}
                                    >
                                      {convertMinutesToReadable(end)}
                                    </span>
                                  </div>

                                  <div className="flex flex-col items-center gap-2">
                                    {/* Status badge for current/upcoming */}
                                    {isCurrent && (
                                      <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-300 text-xs">NOW</span>
                                    )}
                                    {isUpcoming && (
                                      <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300 text-xs">SOON</span>
                                    )}

                                    <span
                                      className={cn(
                                        "rounded-md px-2 py-0.5 font-mono text-xs",
                                        isPast && "bg-zinc-800/30 text-zinc-500/70",
                                        isActive && "bg-emerald-500/15 text-emerald-300",
                                        !isPast && !isActive && "bg-white/5 text-zinc-300/80"
                                      )}
                                    >
                                      {durationLabel(start, end)}
                                    </span>
                                  </div>
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

      {/* Add shimmy animation styles */}
      <style jsx>{`
          @keyframes shimmy {
              0%, 100% {
                  transform: translateX(0);
              }

              10% {
                  transform: translateX(-1px);
              }

              20% {
                  transform: translateX(-2px);
              }

              30% {
                  transform: translateX(-3px);
              }

              40% {
                  transform: translateX(-2px);
              }

              50% {
                  transform: translateX(0);
              }

              60% {
                  transform: translateX(2px);
              }

              70% {
                  transform: translateX(3px);
              }

              80% {
                  transform: translateX(2px);
              }

              90% {
                  transform: translateX(1px);
              }
          }
        
        .animate-shimmy {
          animation: shimmy 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

export function AvailabilitySkeleton() {
  const todayName = dayNames[new Date().getDay()];

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-neutral-900/95 p-5 font-bold text-xl text-zinc-300/80 shadow-xl/80 sm:text-2xl">
      <div className="flex items-center">
        <CalendarClock className="mr-2 h-6 w-6" />
        <div>Availability</div>
      </div>

      {/* Desktop View */}
      <Tabs defaultValue={todayName} orientation="vertical" className="mt-3 hidden min-h-0 flex-1 gap-2 xl:flex">
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

        <div className="min-h-0 flex-1">
          {dayNames.map((day) => (
            <TabsContent key={day} value={day} className="m-0 h-full">
              <AvailabilitySkeletonPanel day={day} />
            </TabsContent>
          ))}
        </div>
      </Tabs>

      {/* Mobile View */}
      <Tabs defaultValue={todayName} className="mt-3 flex min-h-0 flex-1 flex-col gap-4 xl:hidden">
        <TabsList className="mx-auto ml-5 w-full flex-row items-stretch gap-1 overflow-x-auto rounded-xl border bg-zinc-950/40 p-2">
          {dayNames.map((day) => (
            <TabsTrigger
              key={day}
              value={day}
              className={cn(
                "shrink-0 justify-center capitalize",
                "rounded-lg px-3 py-2 font-semibold text-sm text-zinc-300/80",
                "data-[state=active]:bg-white/10 data-[state=active]:text-zinc-100",
                "hover:bg-white/5"
              )}
            >
              {day}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="min-h-0 flex-1">
          {dayNames.map((day) => (
            <TabsContent key={day} value={day} className="m-0 h-full">
              <AvailabilitySkeletonPanel day={day} />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}

function AvailabilitySkeletonPanel({ day }: { day: string }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/30">
      <div className="flex shrink-0 items-center justify-between border-zinc-800 border-b px-4 py-3">
        <div className="flex flex-col items-start gap-1">
          <div className="font-bold text-base text-zinc-200/90 capitalize sm:text-lg">{day}</div>

          <div className="flex cursor-pointer items-center gap-1">
            <Checkbox checked={false} disabled className="border border-neutral-400" />
            <span className="animate-pulse font-normal text-sm text-zinc-600">Omit short breaks</span>
          </div>
        </div>

        {/* block count skeleton */}
        <div className="h-4 w-16 animate-pulse rounded bg-zinc-700/50" />
      </div>

      <ScrollArea className="mb-2 h-full min-h-0 flex-1">
        <div className="space-y-2 p-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <AvailabilityBlockSkeleton key={index} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function AvailabilityBlockSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-white/5 bg-zinc-800/40 px-3 py-2">
      <div className="absolute inset-y-0 left-0 w-1 bg-white/10" />

      <div className="flex items-center justify-between gap-3 pl-2">
        <div className="flex items-center gap-2">
          {/* start time */}
          <div className="h-6 w-16 animate-pulse rounded bg-zinc-700/50" />

          <span className="text-zinc-500">→</span>

          {/* end time */}
          <div className="h-6 w-16 animate-pulse rounded bg-zinc-700/50" />
        </div>

        <div className="flex flex-col items-center gap-2">
          {/* optional NOW / SOON badge placeholder */}
          <div className="h-5 w-10 animate-pulse rounded-md bg-zinc-700/40" />

          {/* duration */}
          <div className="h-5 w-12 animate-pulse rounded-md bg-zinc-700/50" />
        </div>
      </div>
    </div>
  );
}
