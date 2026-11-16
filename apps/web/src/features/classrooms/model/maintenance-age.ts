import { TZDate } from "@redwood/shad-ui/lib/date";

const PACIFIC_TIME_ZONE = "America/Los_Angeles";
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const DAYS_PER_YEAR = 365;
const PENDING_AFTER_DAYS = 14;
const OVERDUE_AFTER_DAYS = 30;
const relativeTime = new Intl.RelativeTimeFormat("en-US");

export function getPacificCalendarDay(date = new Date()) {
  const pacificDate = new TZDate(date, PACIFIC_TIME_ZONE);
  // Count calendar dates on a UTC scale so daylight saving changes do not affect the difference.
  const utcDate = new Date(0);
  return utcDate.setUTCFullYear(pacificDate.getFullYear(), pacificDate.getMonth(), pacificDate.getDate()) / MILLISECONDS_PER_DAY;
}

export function getNextPacificMidnight(now: Date) {
  const pacificDate = new TZDate(now, PACIFIC_TIME_ZONE);
  return new TZDate(pacificDate.getFullYear(), pacificDate.getMonth(), pacificDate.getDate() + 1, PACIFIC_TIME_ZONE).getTime();
}

function formatMaintenanceAge(daysAgo: number) {
  if (daysAgo === 0) return "today";

  const days = Math.abs(daysAgo);
  const direction = -Math.sign(daysAgo);
  if (days >= DAYS_PER_YEAR) return relativeTime.format(direction * Math.floor(days / DAYS_PER_YEAR), "year");
  if (days >= DAYS_PER_MONTH) return relativeTime.format(direction * Math.floor(days / DAYS_PER_MONTH), "month");
  if (days >= DAYS_PER_WEEK) return relativeTime.format(direction * Math.floor(days / DAYS_PER_WEEK), "week");
  return relativeTime.format(-daysAgo, "day");
}

export function getClassroomMaintenanceDisplay(date: Date, today = getPacificCalendarDay()) {
  const daysAgo = today - getPacificCalendarDay(date);
  const age = formatMaintenanceAge(daysAgo);

  if (daysAgo < PENDING_AFTER_DAYS) return { age, color: "green", status: "Up to Date" } as const;
  if (daysAgo <= OVERDUE_AFTER_DAYS) return { age, color: "orange", status: "Pending" } as const;
  return { age, color: "red", status: "Overdue" } as const;
}
