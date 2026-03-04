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

const WEEKDAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export function getCaliClock() {
  const now = new Date();
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

type Block = { startTimeMin: number; endTimeMin: number };
type DayAvailability =
  | { kind: "open"; endMinTime: number; startMinTime: number }
  | { kind: "closed"; nextStartMinTime: number; nextEndMinTime: number }
  | { kind: "none" }; // no more windows today

export function dayAvailability(blocks: Block[], nowMinTime: number): DayAvailability {
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

export function getBlocksForToday(schedule: z.infer<typeof scheduleSchema>, weekdayKey: WeekdayKey): Block[] {
  return schedule?.[weekdayKey] ?? [];
}

export function convertMinutesToReadable(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}
