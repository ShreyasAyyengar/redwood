import { z } from "zod";

// ---- helpers ----
const weekdayMap = {
  Monday: "monday",
  Tuesday: "tuesday",
  Wednesday: "wednesday",
  Thursday: "thursday",
  Friday: "friday",
} as const;

type WeekdayIn = keyof typeof weekdayMap;
type WeekdayKey = (typeof weekdayMap)[WeekdayIn];
type WeeklySchedule = Record<WeekdayKey, { startTime: string; endTime: string }[]>;

export function emptySchedule(): WeeklySchedule {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
  };
}

export const rowSchema = z.object({
  Room: z.string().min(1),
  Weekday: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
  Start_Time: z.string(),
  End_Time: z.string(),
});

export function processTimeRanges(rows: z.infer<typeof rowSchema>[]): WeeklySchedule {
  const schedule = emptySchedule();

  for (const row of rows) {
    const weekdayKey = weekdayMap[row.Weekday];
    schedule[weekdayKey].push({
      startTime: row.Start_Time,
      endTime: row.End_Time,
    });
  }

  return schedule;
}
