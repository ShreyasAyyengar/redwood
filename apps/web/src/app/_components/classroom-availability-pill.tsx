import type { classroomSchemaPayload } from "@redwood/contracts";
import { cn } from "@redwood/shad-ui/lib/utils";
import { Clock3 } from "lucide-react";
import type { z } from "zod";
import { convertMinutesToReadable, dayAvailability, getBlocksForToday, getCaliClock } from "../../util/date-time-utils";

// TODO centralise this logic a bit more with the logic that's already in availability.tsx; this is too messy
// TODO remove this pill from tasks/
type Classroom = z.infer<typeof classroomSchemaPayload>;
type Schedule = NonNullable<Classroom["schedule"]>;
type WeekdayKey = keyof Schedule;
type AvailabilityDisplay = {
  label: string;
  range?: string;
  title: string;
  tone: "available" | "next" | "unavailable";
};

const WEEKDAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const satisfies WeekdayKey[];
const DAY_LABELS: Record<WeekdayKey, string> = {
  friday: "Fri",
  monday: "Mon",
  saturday: "Sat",
  sunday: "Sun",
  thursday: "Thu",
  tuesday: "Tue",
  wednesday: "Wed",
};

const toneStyles: Record<AvailabilityDisplay["tone"], string> = {
  available: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100 shadow-emerald-950/20",
  next: "border-cyan-500/25 bg-cyan-500/10 text-cyan-100 shadow-cyan-950/20",
  unavailable: "border-zinc-800/80 bg-zinc-950/50 text-zinc-400",
};

function formatRange(startMinTime: number, endMinTime: number) {
  return `${convertMinutesToReadable(startMinTime)} - ${convertMinutesToReadable(endMinTime)}`;
}

function getSortedBlocks(schedule: Schedule, weekdayKey: WeekdayKey) {
  return [...getBlocksForToday(schedule, weekdayKey)].sort((a, b) => a.startTimeMin - b.startTimeMin);
}

function getAvailabilityDisplay(room: Classroom): AvailabilityDisplay | undefined {
  if (!room.schedule) return;

  const { weekdayKey, nowMin } = getCaliClock();
  const todaysBlocks = getSortedBlocks(room.schedule, weekdayKey);
  const availability = dayAvailability(todaysBlocks, nowMin);

  if (availability.kind === "open") {
    const range = formatRange(availability.startMinTime, availability.endMinTime);

    return {
      label: "Available Now!",
      range,
      title: `${room.displayName} is available now, ${range}.`,
      tone: "available",
    };
  }

  if (availability.kind === "closed") {
    const range = formatRange(availability.nextStartMinTime, availability.nextEndMinTime);

    return {
      label: "Next Available",
      range,
      title: `${room.displayName} is next available today, ${range}.`,
      tone: "next",
    };
  }

  const todayIndex = WEEKDAY_KEYS.indexOf(weekdayKey);

  for (let offset = 1; offset < WEEKDAY_KEYS.length; offset += 1) {
    const nextWeekdayKey = WEEKDAY_KEYS[(todayIndex + offset) % WEEKDAY_KEYS.length];

    if (!nextWeekdayKey) continue;

    const nextBlock = getSortedBlocks(room.schedule, nextWeekdayKey)[0];

    if (nextBlock) {
      const dayLabel = offset === 1 ? "Tomorrow" : DAY_LABELS[nextWeekdayKey];
      const range = `${dayLabel} ${formatRange(nextBlock.startTimeMin, nextBlock.endTimeMin)}`;

      return {
        label: "Next Available",
        range,
        title: `${room.displayName} is next available ${range}.`,
        tone: "next",
      };
    }
  }

  return {
    label: "No availability posted",
    title: `${room.displayName} does not have upcoming availability on the current schedule.`,
    tone: "unavailable",
  };
}

export function ClassroomAvailabilityPill({ room, className }: { room: Classroom; className?: string }) {
  const availability = getAvailabilityDisplay(room);

  if (!availability) return null;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 align-middle font-medium text-[11px] leading-none shadow-sm",
        toneStyles[availability.tone],
        className
      )}
      title={availability.title}
    >
      <Clock3 className="size-3 shrink-0 opacity-80" />
      <span className="shrink-0">{availability.label}</span>
      {availability.range && <span className="min-w-0 truncate text-current/70">({availability.range})</span>}
    </span>
  );
}
