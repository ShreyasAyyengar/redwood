"use client";

import type { classroomSchema } from "@redwood/contracts";
import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@redwood/shad-ui/components/tabs";
import { cn } from "@redwood/shad-ui/lib/utils";
import { CalendarClock } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import type { z } from "zod";
import { convertMinutesToReadable } from "../../../../util/date-time-utils";

const SHORT_BREAK_MINUTES = 15;
const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const satisfies Record<number, string>;
const OMIT_SHORT_BREAKS_STORAGE_KEY = "omittingShortBreaks";
const SKELETON_BLOCK_KEYS = ["first", "second", "third", "fourth"] as const;

type Room = z.infer<typeof classroomSchema>;
type DayName = (typeof DAY_NAMES)[number];
type Block = NonNullable<Room["schedule"]>[DayName][number];
type BlockStatus = "current" | "future" | "past" | "upcoming";

function getDayName(dayIndex: number): DayName {
  return DAY_NAMES[dayIndex] ?? "sunday";
}

export default function Availability({ room }: { room: Room }) {
  const [omitShortBreaks, setOmitShortBreaks] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return localStorage.getItem(OMIT_SHORT_BREAKS_STORAGE_KEY) === "true";
  });
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const todayName = getDayName(currentTime.getDay());
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const blocksByDay = useMemo(
    () =>
      DAY_NAMES.reduce(
        (acc, day) => {
          acc[day] = room.schedule?.[day] ?? [];
          return acc;
        },
        {} as Record<DayName, Block[]>
      ),
    [room.schedule]
  );

  const setOmitShortBreakPreference = (checked: boolean) => {
    setOmitShortBreaks(checked);
    localStorage.setItem(OMIT_SHORT_BREAKS_STORAGE_KEY, String(checked));
  };

  const getBlockStatus = (day: DayName, startMin: number, endMin: number): BlockStatus => {
    if (currentTime.getDay() !== DAY_NAMES.indexOf(day)) {
      return "future";
    }

    if (currentMinutes >= startMin && currentMinutes < endMin) {
      return "current";
    }

    if (currentMinutes < startMin && startMin - currentMinutes <= SHORT_BREAK_MINUTES) {
      return "upcoming";
    }

    if (currentMinutes >= endMin) {
      return "past";
    }

    return "future";
  };

  return (
    <AvailabilityFrame>
      <AvailabilityTabs defaultValue={todayName}>
        <DayTabList />
        <DayTabPanels
          blocksByDay={blocksByDay}
          getBlockStatus={getBlockStatus}
          omitShortBreaks={omitShortBreaks}
          onOmitShortBreaksChange={setOmitShortBreakPreference}
        />
      </AvailabilityTabs>

      <ShimmyStyles />
    </AvailabilityFrame>
  );
}

function AvailabilityFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-neutral-900/95 p-5",
        "font-bold text-xl text-zinc-300/80 shadow-xl/80 sm:text-2xl"
      )}
    >
      <div className="flex items-center">
        <CalendarClock className="mr-2 h-6 w-6" />
        <div>Availability</div>
      </div>

      {children}
    </div>
  );
}

function AvailabilityTabs({ children, defaultValue }: { children: React.ReactNode; defaultValue: DayName }) {
  return (
    <Tabs defaultValue={defaultValue} className="mt-3 flex min-h-0 flex-1 flex-col">
      {children}
    </Tabs>
  );
}

function DayTabList() {
  return (
    <TabsList className="grid w-full grid-cols-7 items-stretch gap-1 overflow-hidden rounded-xl border bg-zinc-950/40 p-1">
      {DAY_NAMES.map((day, index) => (
        <TabsTrigger
          key={day}
          value={day}
          className={cn(
            "min-w-0 justify-center",
            "rounded-lg font-semibold text-sm text-zinc-300/80 leading-none",
            "data-[state=active]:bg-white/10 data-[state=active]:text-zinc-100",
            "hover:bg-white/5"
          )}
        >
          {SHORT_DAY_NAMES[index]}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

function DayTabPanels({
  blocksByDay,
  getBlockStatus,
  omitShortBreaks,
  onOmitShortBreaksChange,
}: {
  blocksByDay: Record<DayName, Block[]>;
  getBlockStatus: (day: DayName, startMin: number, endMin: number) => BlockStatus;
  omitShortBreaks: boolean;
  onOmitShortBreaksChange: (checked: boolean) => void;
}) {
  return (
    <div className="min-h-0 flex-1">
      {DAY_NAMES.map((day) => (
        <TabsContent key={day} value={day} className="m-0 h-full">
          <AvailabilityPanel
            blocks={blocksByDay[day]}
            day={day}
            getBlockStatus={getBlockStatus}
            omitShortBreaks={omitShortBreaks}
            onOmitShortBreaksChange={onOmitShortBreaksChange}
          />
        </TabsContent>
      ))}
    </div>
  );
}

function AvailabilityPanel({
  blocks,
  day,
  getBlockStatus,
  omitShortBreaks,
  onOmitShortBreaksChange,
}: {
  blocks: Block[];
  day: DayName;
  getBlockStatus: (day: DayName, startMin: number, endMin: number) => BlockStatus;
  omitShortBreaks: boolean;
  onOmitShortBreaksChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/30">
      <AvailabilityPanelHeader
        blockCount={blocks.length}
        day={day}
        omitShortBreaks={omitShortBreaks}
        onOmitShortBreaksChange={onOmitShortBreaksChange}
      />

      <ScrollArea className="mb-2 h-full min-h-0 flex-1">
        <div className="p-3">
          {blocks.length === 0 ? (
            <EmptyAvailability />
          ) : (
            <div className="space-y-2">
              {blocks.map((block) => (
                <AvailabilityBlock
                  block={block}
                  day={day}
                  getBlockStatus={getBlockStatus}
                  key={`${block.startTimeMin}-${block.endTimeMin}`}
                  omitShortBreaks={omitShortBreaks}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function AvailabilityPanelHeader({
  blockCount,
  day,
  omitShortBreaks,
  onOmitShortBreaksChange,
}: {
  blockCount: number;
  day: DayName;
  omitShortBreaks: boolean;
  onOmitShortBreaksChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between border-zinc-800 border-b px-4 py-3">
      <div className="flex flex-row items-center gap-5">
        <div className="font-bold text-base text-zinc-200/90 capitalize sm:text-lg">{day}</div>
        <OmitShortBreaksControl checked={omitShortBreaks} onCheckedChange={onOmitShortBreaksChange} />
      </div>

      <div className="font-mono text-xs text-zinc-400">{blockCount ? `${blockCount} block${blockCount === 1 ? "" : "s"}` : "No blocks"}</div>
    </div>
  );
}

function OmitShortBreaksControl({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  const checkboxId = useId();

  return (
    <label className="flex cursor-pointer items-center gap-2" htmlFor={checkboxId}>
      <Checkbox
        checked={checked}
        className="border border-neutral-400"
        id={checkboxId}
        name={checkboxId}
        onCheckedChange={(nextChecked) => onCheckedChange(nextChecked === true)}
      />
      <span className={cn("font-normal text-sm text-zinc-400 transition-all duration-150", checked && "font-bold text-zinc-300")}>
        Omit short breaks
      </span>
    </label>
  );
}

function EmptyAvailability() {
  return (
    <div className="rounded-lg border border-zinc-800 border-dashed bg-zinc-950/20 p-4 font-medium text-sm text-zinc-400">
      No availability for this day.
    </div>
  );
}

function AvailabilityBlock({
  block,
  day,
  getBlockStatus,
  omitShortBreaks,
}: {
  block: Block;
  day: DayName;
  getBlockStatus: (day: DayName, startMin: number, endMin: number) => BlockStatus;
  omitShortBreaks: boolean;
}) {
  const start = block.startTimeMin;
  const end = block.endTimeMin;
  const duration = omitShortBreaks && end - start < 60 ? 0 : end - start;

  if (duration < SHORT_BREAK_MINUTES) {
    return null;
  }

  const status = getBlockStatus(day, start, end);
  const isPast = status === "past";
  const isCurrent = status === "current";
  const isUpcoming = status === "upcoming";
  const isActive = isCurrent || isUpcoming;
  const isFuture = !(isPast || isActive);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border px-3 py-2",
        "transition",
        isPast && "border-zinc-800/50 bg-zinc-900/20 opacity-50",
        isActive && "animate-shimmy border-emerald-500/40 bg-emerald-950/30",
        isFuture && "border-white/5 bg-zinc-800/40 hover:border-white/10 hover:bg-zinc-900/60"
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1",
          isPast && "bg-zinc-700/30",
          isActive && "animate-pulse bg-emerald-500/70",
          isFuture && "bg-white/10 group-hover:bg-white/15"
        )}
      />

      <div className="flex items-center justify-between gap-3 pl-2">
        <AvailabilityBlockTimeRange end={end} isActive={isActive} isPast={isPast} start={start} />
        <AvailabilityBlockMeta end={end} isActive={isActive} isCurrent={isCurrent} isPast={isPast} isUpcoming={isUpcoming} start={start} />
      </div>
    </div>
  );
}

function AvailabilityBlockTimeRange({ end, isActive, isPast, start }: { end: number; isActive: boolean; isPast: boolean; start: number }) {
  const isFuture = !(isPast || isActive);
  const timeClassName = cn("text-lg", isPast && "text-zinc-500/70", isActive && "font-bold text-emerald-100", isFuture && "text-zinc-100/90");
  const arrowClassName = cn(isPast && "text-zinc-600/50", isActive && "text-emerald-400", isFuture && "text-zinc-500");

  return (
    <div className="flex items-center gap-2">
      <span className={timeClassName}>{convertMinutesToReadable(start)}</span>
      <span className={arrowClassName}>→</span>
      <span className={timeClassName}>{convertMinutesToReadable(end)}</span>
    </div>
  );
}

function AvailabilityBlockMeta({
  end,
  isActive,
  isCurrent,
  isPast,
  isUpcoming,
  start,
}: {
  end: number;
  isActive: boolean;
  isCurrent: boolean;
  isPast: boolean;
  isUpcoming: boolean;
  start: number;
}) {
  const isFuture = !(isPast || isActive);

  return (
    <div className="flex flex-col items-center gap-2">
      {isCurrent && <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 font-bold text-emerald-300 text-xs">NOW</span>}
      {isUpcoming && <span className="rounded-md bg-amber-500/20 px-2 py-0.5 font-bold text-amber-300 text-xs">SOON</span>}

      <span
        className={cn(
          "rounded-md px-2 py-0.5 font-mono text-xs",
          isPast && "bg-zinc-800/30 text-zinc-500/70",
          isActive && "bg-emerald-500/15 text-emerald-300",
          isFuture && "bg-white/5 text-zinc-300/80"
        )}
      >
        {durationLabel(start, end)}
      </span>
    </div>
  );
}

function durationLabel(start: number, end: number) {
  const mins = Math.max(0, end - start);
  if (mins < 60) {
    return `${mins}m`;
  }

  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export function AvailabilitySkeleton() {
  const todayName = getDayName(new Date().getDay());

  return (
    <AvailabilityFrame>
      <AvailabilityTabs defaultValue={todayName}>
        <DayTabList />

        <div className="min-h-0 flex-1">
          {DAY_NAMES.map((day) => (
            <TabsContent key={day} value={day} className="m-0 h-full">
              <AvailabilitySkeletonPanel day={day} />
            </TabsContent>
          ))}
        </div>
      </AvailabilityTabs>
    </AvailabilityFrame>
  );
}

function AvailabilitySkeletonPanel({ day }: { day: string }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/30">
      <div className="flex shrink-0 items-center justify-between border-zinc-800 border-b px-4 py-3">
        <div className="flex flex-col items-start gap-1">
          <div className="font-bold text-base text-zinc-200/90 capitalize sm:text-lg">{day}</div>

          <div className="flex cursor-pointer items-center gap-1">
            <Checkbox checked={false} className="border border-neutral-400" disabled />
            <span className="animate-pulse font-normal text-sm text-zinc-600">Omit short breaks</span>
          </div>
        </div>

        <div className="h-4 w-16 animate-pulse rounded bg-zinc-700/50" />
      </div>

      <ScrollArea className="mb-2 h-full min-h-0 flex-1">
        <div className="space-y-2 p-3">
          {SKELETON_BLOCK_KEYS.map((key) => (
            <AvailabilityBlockSkeleton key={key} />
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
          <div className="h-6 w-16 animate-pulse rounded bg-zinc-700/50" />
          <span className="text-zinc-500">→</span>
          <div className="h-6 w-16 animate-pulse rounded bg-zinc-700/50" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="h-5 w-10 animate-pulse rounded-md bg-zinc-700/40" />
          <div className="h-5 w-12 animate-pulse rounded-md bg-zinc-700/50" />
        </div>
      </div>
    </div>
  );
}

function ShimmyStyles() {
  return (
    <style jsx global>{`
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
  );
}
