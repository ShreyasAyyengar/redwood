import { z } from "zod";

const weekdayMap = {
  Monday: "monday",
  Tuesday: "tuesday",
  Wednesday: "wednesday",
  Thursday: "thursday",
  Friday: "friday",
  Saturday: "saturday",
  Sunday: "sunday",
} as const;

type Weekday = keyof typeof weekdayMap;
type WeekdayKey = (typeof weekdayMap)[Weekday];
export type WeeklySchedule = Record<WeekdayKey, { startTimeMin: number; endTimeMin: number }[]>;

export const csvRowSchema = z.object({
  Room: z.string().trim().min(1),
  Weekday: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]),
  Start_Time: z.string(),
  End_Time: z.string(),
});

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

const TIME_REGEX = /^(0[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/;
const HOURS_PER_HALF_DAY = 12;
const MINUTES_PER_HOUR = 60;

function timeToMinutes(time: string): number {
  const match = TIME_REGEX.exec(time);
  if (!match) throw new Error(`Invalid time: ${time}`);

  let hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours === HOURS_PER_HALF_DAY) hours = 0;
  if (match[3] === "PM") hours += HOURS_PER_HALF_DAY;

  return hours * MINUTES_PER_HOUR + minutes;
}

export function processTimeRanges(rows: z.infer<typeof csvRowSchema>[]): WeeklySchedule {
  const schedule = emptySchedule();

  for (const row of rows) {
    schedule[weekdayMap[row.Weekday]].push({
      startTimeMin: timeToMinutes(row.Start_Time),
      endTimeMin: timeToMinutes(row.End_Time),
    });
  }

  return schedule;
}
