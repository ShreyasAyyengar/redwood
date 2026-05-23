import type { scheduleSchema } from "@redwood/contracts";
import type { z } from "zod";

export const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const nth = (d: number) => {
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

export const WEEKDAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
export const SHORT_WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];
export type Schedule = z.infer<typeof scheduleSchema>;
export type ScheduleBlock = Schedule[WeekdayKey][number];

export const SHORT_WEEKDAY_LABEL_BY_KEY: Record<WeekdayKey, string> = {
  friday: "Fri",
  monday: "Mon",
  saturday: "Sat",
  sunday: "Sun",
  thursday: "Thu",
  tuesday: "Tue",
  wednesday: "Wed",
};

export function getCaliClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  // biome-ignore lint/style/noNonNullAssertion: we know these will exist
  const weekdayStr = parts.find((p) => p.type === "weekday")!.value; // "Monday"
  // biome-ignore lint/style/noNonNullAssertion: we know these will exist
  const hour = Number(parts.find((p) => p.type === "hour")!.value);
  // biome-ignore lint/style/noNonNullAssertion: we know these will exist
  const minute = Number(parts.find((p) => p.type === "minute")!.value);

  const weekdayKey = weekdayStr.toLowerCase() as WeekdayKey; // "monday"
  const nowMin = hour * 60 + minute;

  return { weekdayKey, nowMin };
}

type SortKey = { group: number; time: number };

export function toSortKey(av: DayAvailability): SortKey {
  if (av.kind === "open") return { group: 0, time: av.endMinTime }; // closes soonest first
  if (av.kind === "closed") return { group: 1, time: av.nextStartMinTime }; // opens soonest first
  return { group: 2, time: Number.POSITIVE_INFINITY }; // last
}

type DayAvailability =
  | { kind: "open"; endMinTime: number; startMinTime: number }
  | { kind: "closed"; nextStartMinTime: number; nextEndMinTime: number }
  | { kind: "none" }; // no more windows today

export type ScheduleAvailability =
  | { kind: "open"; endMinTime: number; startMinTime: number; weekdayKey: WeekdayKey }
  | { dayOffset: number; kind: "next"; nextEndMinTime: number; nextStartMinTime: number; weekdayKey: WeekdayKey }
  | { kind: "none" };

export function dayAvailability(blocks: ScheduleBlock[], nowMinTime: number): DayAvailability {
  // blocks assumed sorted by startMinTime
  for (const b of blocks) {
    if (b.startTimeMin <= nowMinTime && nowMinTime < b.endTimeMin) {
      return { kind: "open", startMinTime: b.startTimeMin, endMinTime: b.endTimeMin };
    }
  }
  for (const b of blocks) {
    if (nowMinTime < b.startTimeMin) {
      return { kind: "closed", nextStartMinTime: b.startTimeMin, nextEndMinTime: b.endTimeMin };
    }
  }
  return { kind: "none" };
}

export function getBlocksForToday(schedule: Schedule, weekdayKey: WeekdayKey): ScheduleBlock[] {
  return schedule?.[weekdayKey] ?? [];
}

export function getSortedBlocksForDay(schedule: Schedule, weekdayKey: WeekdayKey): ScheduleBlock[] {
  return [...getBlocksForToday(schedule, weekdayKey)].sort((a, b) => a.startTimeMin - b.startTimeMin);
}

export function getScheduleAvailability(schedule: Schedule, clock = getCaliClock()): ScheduleAvailability {
  const todaysBlocks = getSortedBlocksForDay(schedule, clock.weekdayKey);
  const availability = dayAvailability(todaysBlocks, clock.nowMin);

  if (availability.kind === "open") {
    return {
      kind: "open",
      startMinTime: availability.startMinTime,
      endMinTime: availability.endMinTime,
      weekdayKey: clock.weekdayKey,
    };
  }

  if (availability.kind === "closed") {
    return {
      dayOffset: 0,
      kind: "next",
      nextStartMinTime: availability.nextStartMinTime,
      nextEndMinTime: availability.nextEndMinTime,
      weekdayKey: clock.weekdayKey,
    };
  }

  const todayIndex = WEEKDAY_KEYS.indexOf(clock.weekdayKey);

  for (let offset = 1; offset < WEEKDAY_KEYS.length; offset += 1) {
    const nextWeekdayKey = WEEKDAY_KEYS[(todayIndex + offset) % WEEKDAY_KEYS.length];

    if (!nextWeekdayKey) continue;

    const nextBlock = getSortedBlocksForDay(schedule, nextWeekdayKey)[0];

    if (nextBlock) {
      return {
        dayOffset: offset,
        kind: "next",
        nextStartMinTime: nextBlock.startTimeMin,
        nextEndMinTime: nextBlock.endTimeMin,
        weekdayKey: nextWeekdayKey,
      };
    }
  }

  return { kind: "none" };
}

// converts minutes after midnight to a readable time
export function convertMinutesToReadable(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}

export function formatMinutesRange(startMinTime: number, endMinTime: number) {
  return `${convertMinutesToReadable(startMinTime)} - ${convertMinutesToReadable(endMinTime)}`;
}

export type DateTimeDisplay = {
  dateAbsolute: string;
  dateDaysAgo: string;
};

export function getDateTimeDisplay(date: Date): DateTimeDisplay {
  return {
    dateAbsolute: formatDateAbsolute(date),
    dateDaysAgo: daysAgoRelative(date),
  };
}

export function daysAgoNumeric(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

// TODO return more -> 0-60 seconds, 0-60 mins, 0-24 hours, 0-7 days, 0-30 days, 0-12 months, + years
export function daysAgoRelative(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const absMs = Math.abs(diffMs);

  const isPast = diffMs < 0;
  const suffix = isPast ? "ago" : "from now";

  const second = 1000;
  const minute = 60 * second;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  const year = 365 * day;

  const format = (value: number, unit: string) => {
    const rounded = Math.floor(value);
    return `${rounded} ${unit}${rounded === 1 ? "" : "s"} ${suffix}`;
  };

  if (absMs < 5 * second) return "just now";

  if (absMs < minute) return format(absMs / second, "second");

  if (absMs < hour) return format(absMs / minute, "minute");

  if (absMs < day) return format(absMs / hour, "hour");

  if (absMs < 7 * day) return format(absMs / day, "day");

  if (absMs < month) {
    const weeks = Math.floor(absMs / (7 * day));
    return `${weeks} week${weeks === 1 ? "" : "s"} ${suffix}`;
  }

  if (absMs < year) return format(absMs / month, "month");
  return format(absMs / year, "year");
}

export function formatDate(date: Date): string {
  const monthName = monthNames[date.getMonth()];
  const day = date.getDate();
  const dayEnding = nth(day);
  return `${monthName} ${day}${dayEnding}`;
}

export function formatDateAbsolute(date: Date): string {
  const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "long" });
  const year = date.getFullYear();

  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return `${weekday}, ${day} ${month} ${year} at ${time}`;
}
