import { TZDate } from "@redwood/shad-ui/lib/date";

export const CSV_TIME_ZONE = "America/Los_Angeles";

export function getCSVCalendarToday(now = Date.now()) {
  return new TZDate(now, CSV_TIME_ZONE);
}

export function getCSVEffectiveOn(value: Date | undefined, now = Date.now()) {
  if (!value) throw new Error("Choose the date when the CSV should take effect.");
  if (!Number.isFinite(value.getTime())) throw new Error("Choose a valid date.");

  const midnight = new TZDate(value.getFullYear(), value.getMonth(), value.getDate(), CSV_TIME_ZONE);
  if (midnight.getTime() <= now) throw new Error("Choose a future date for the CSV to take effect, or apply it immediately.");

  return new Date(midnight.getTime()).toISOString();
}
