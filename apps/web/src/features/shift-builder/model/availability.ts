import { type Schedule, type ScheduleBlock, WEEKDAY_KEYS, type WeekdayKey } from "../../../util/date-time-utils.ts";

export const MINUTES_PER_DAY = 1440;

export function findShiftOpenings(
  schedule: Schedule | undefined,
  day: WeekdayKey,
  start: number,
  end: number,
  maintenance: number
): ScheduleBlock[] {
  if (!schedule) return [];
  const shiftEnd = end <= start ? end + MINUTES_PER_DAY : end;
  const nextDay = WEEKDAY_KEYS[(WEEKDAY_KEYS.indexOf(day) + 1) % WEEKDAY_KEYS.length] ?? "sunday";
  const blocks = [
    ...schedule[day],
    ...(shiftEnd > MINUTES_PER_DAY
      ? schedule[nextDay].map((block) => ({
          startTimeMin: block.startTimeMin + MINUTES_PER_DAY,
          endTimeMin: block.endTimeMin + MINUTES_PER_DAY,
        }))
      : []),
  ]
    .map((block) => ({ startTimeMin: Math.max(start, block.startTimeMin), endTimeMin: Math.min(shiftEnd, block.endTimeMin) }))
    .filter((block) => block.endTimeMin > block.startTimeMin)
    .sort((a, b) => a.startTimeMin - b.startTimeMin);
  const merged: ScheduleBlock[] = [];
  for (const block of blocks) {
    const previous = merged.at(-1);
    if (previous && block.startTimeMin <= previous.endTimeMin) {
      previous.endTimeMin = Math.max(previous.endTimeMin, block.endTimeMin);
    } else {
      merged.push({ ...block });
    }
  }
  return merged.filter((block) => block.endTimeMin - block.startTimeMin >= maintenance);
}
