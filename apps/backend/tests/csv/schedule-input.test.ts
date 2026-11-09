import { describe, expect, test } from "bun:test";
import { CSV_TIME_ZONE, getCSVCalendarToday, getCSVEffectiveOn } from "../../../web/src/features/admin/model/csv-schedule.ts";

const now = new Date("2026-01-01T00:00:00.000Z").getTime();

describe("CSV effective date input", () => {
  test.each([
    ["2030-06-01", "2030-06-01T07:00:00.000Z"],
    ["2030-01-01", "2030-01-01T08:00:00.000Z"],
    ["2030-03-10", "2030-03-10T08:00:00.000Z"],
    ["2030-03-11", "2030-03-11T07:00:00.000Z"],
    ["2030-11-03", "2030-11-03T07:00:00.000Z"],
    ["2030-11-04", "2030-11-04T08:00:00.000Z"],
  ])("schedules %s at midnight Pacific, including daylight saving transitions", (date, expectedISO) => {
    expect(getCSVEffectiveOn(new Date(`${date}T12:00`), now)).toBe(expectedISO);
  });

  test("does not carry a time from the selected date into the scheduled timestamp", () => {
    expect(getCSVEffectiveOn(new Date("2030-06-01T15:45"), now)).toBe("2030-06-01T07:00:00.000Z");
  });

  test("rejects a missing or invalid date", () => {
    expect(() => getCSVEffectiveOn(undefined, now)).toThrow("Choose the date");
    expect(() => getCSVEffectiveOn(new Date("not-a-date"), now)).toThrow("Choose a valid date");
  });

  test("rejects past dates and a date whose Pacific midnight has already passed", () => {
    expect(() => getCSVEffectiveOn(new Date("2025-01-01T12:00"), now)).toThrow("Choose a future date");
    expect(() => getCSVEffectiveOn(new Date("2030-06-01T12:00"), Date.parse("2030-06-01T07:00:00.000Z"))).toThrow("Choose a future date");
  });

  test("the calendar's current day uses Pacific time even when the browser's date differs", () => {
    const today = getCSVCalendarToday(Date.parse("2030-06-01T06:30:00.000Z"));
    expect(today.toLocaleDateString("en-US", { timeZone: CSV_TIME_ZONE })).toBe("5/31/2030");
  });
});
