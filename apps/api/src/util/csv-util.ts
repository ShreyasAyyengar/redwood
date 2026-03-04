import { z } from "zod";

// ---- helpers ----
const weekdayMap = {
  Monday: "monday",
  Tuesday: "tuesday",
  Wednesday: "wednesday",
  Thursday: "thursday",
  Friday: "friday",
  Saturday: "saturday",
  Sunday: "sunday",
} as const;

type WeekdayIn = keyof typeof weekdayMap;
type WeekdayKey = (typeof weekdayMap)[WeekdayIn];
type WeeklySchedule = Record<WeekdayKey, { startTimeMin: number; endTimeMin: number }[]>;

export function emptySchedule(): WeeklySchedule {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };
}

export const rowSchema = z.object({
  Room: z.string().min(1),
  Weekday: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
  Start_Time: z.string(),
  End_Time: z.string(),
});

const TIME_REGEX = /^(0[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/;
export function timeToMinutes(t: string): number {
  const m = TIME_REGEX.exec(t);
  if (!m) throw new Error(`Invalid time: ${t}`);

  let hh = Number(m[1]);
  const mm = Number(m[2]);
  const ap = m[3];

  // 12:xx AM => 00:xx, 12:xx PM => 12:xx
  if (hh === 12) hh = 0;
  if (ap === "PM") hh += 12;

  return hh * 60 + mm;
}

export function processTimeRanges(rows: z.infer<typeof rowSchema>[]): WeeklySchedule {
  const schedule = emptySchedule();

  for (const row of rows) {
    const weekdayKey = weekdayMap[row.Weekday];
    schedule[weekdayKey].push({
      startTimeMin: timeToMinutes(row.Start_Time),
      endTimeMin: timeToMinutes(row.End_Time),
    });
  }

  return schedule;
}
