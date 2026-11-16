import { describe, expect, test } from "bun:test";
import {
  getClassroomMaintenanceDisplay,
  getNextPacificMidnight,
  getPacificCalendarDay,
} from "../../src/features/classrooms/model/maintenance-age";

describe("classroom maintenance age", () => {
  const serviced = new Date("2026-11-02T11:45:00-08:00");

  test.each([
    ["2026-11-09T00:00:00-08:00", { age: "1 week ago", color: "green", status: "Up to Date" }],
    ["2026-11-15T23:59:59-08:00", { age: "1 week ago", color: "green", status: "Up to Date" }],
    ["2026-11-16T00:00:00-08:00", { age: "2 weeks ago", color: "orange", status: "Pending" }],
    ["2026-11-16T08:08:00-08:00", { age: "2 weeks ago", color: "orange", status: "Pending" }],
    ["2026-12-02T23:59:59-08:00", { age: "1 month ago", color: "orange", status: "Pending" }],
    ["2026-12-03T00:00:00-08:00", { age: "1 month ago", color: "red", status: "Overdue" }],
  ] as const)("shows the calendar age and status at %s", (now, expected) => {
    expect(getClassroomMaintenanceDisplay(serviced, getPacificCalendarDay(new Date(now)))).toEqual(expected);
  });

  test("shows today for maintenance on the same Pacific date", () => {
    const today = getPacificCalendarDay(new Date("2026-11-02T23:59:00-08:00"));
    expect(getClassroomMaintenanceDisplay(serviced, today).age).toBe("today");
  });

  test("counts the full calendar day across the spring daylight saving change", () => {
    const before = new Date("2026-03-08T00:00:00-08:00");
    const after = new Date("2026-03-09T00:00:00-07:00");
    expect(getClassroomMaintenanceDisplay(before, getPacificCalendarDay(after)).age).toBe("1 day ago");
    expect(getNextPacificMidnight(before)).toBe(after.getTime());
  });

  test("schedules the next midnight across the fall daylight saving change", () => {
    const before = new Date("2026-11-01T00:00:00-07:00");
    const after = new Date("2026-11-02T00:00:00-08:00");
    expect(getNextPacificMidnight(before)).toBe(after.getTime());
  });
});
