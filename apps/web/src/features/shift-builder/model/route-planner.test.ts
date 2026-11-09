import { describe, expect, test } from "bun:test";
import { createTravelMatrix, planShiftRoute } from "./route-planner";
import type { ShiftMatch } from "./shift-results";

function room(id: string, windows: [number, number][], tasks = 0, issues = 0, group = id): ShiftMatch {
  return {
    room: { _id: id, groupKey: group, openTasksCount: tasks, activeIssuesCount: issues } as ShiftMatch["room"],
    openings: windows.map(([startTimeMin, endTimeMin]) => ({ startTimeMin, endTimeMin })),
  };
}
function plan(matches: ShiftMatch[], start = 0, end = 60, maintenance = 20) {
  return planShiftRoute(
    matches,
    start,
    end,
    maintenance,
    createTravelMatrix(
      [],
      matches.map((match) => match.room.groupKey)
    )
  );
}

describe("shift route planner", () => {
  test("initializes independent zero rows for all editor groups and room groups", () => {
    const matrix = createTravelMatrix(["B", "Empty", "B"], ["A", "Ungrouped"]);
    expect(matrix.buildings).toEqual(["A", "B", "Empty", "Ungrouped"]);
    expect(matrix.minutes).toEqual(Array.from({ length: 4 }, () => [0, 0, 0, 0]));
    matrix.minutes[0] = [0, 5, 0, 0];
    expect(matrix.minutes[1]?.[1]).toBe(0);
  });

  test("explores alternatives instead of taking the first room and missing a deadline", () => {
    const result = plan([room("flexible", [[0, 60]]), room("closing", [[0, 20]])]);
    expect(result.stops.map((stop) => String(stop.room._id))).toEqual(["closing", "flexible"]);
    expect(result.exact).toBe(true);
  });

  test("maximizes work items, counting tasks and issues without additional service time", () => {
    const result = plan([room("low", [[0, 20]]), room("high", [[0, 20]], 3, 2)], 0, 20);
    expect(result.stops.map((stop) => String(stop.room._id))).toEqual(["high"]);
    expect(result.workCount).toBe(6);
  });

  test("checks travel, waiting, room closing, and shift end at every edge", () => {
    const matches = [room("A", [[0, 20]], 10), room("B", [[25, 50]]), room("C", [[20, 40]])];
    const matrix = createTravelMatrix([], ["A", "B", "C"]);
    matrix.minutes[0] = [0, 8, 5];

    const result = planShiftRoute(matches, 0, 48, 20, matrix);
    expect(result.stops.map((stop) => String(stop.room._id))).toEqual(["A", "B"]);
    expect(result.stops[1]).toMatchObject({ arrival: 28, start: 28, end: 48, travel: 8, remaining: 0 });
  });

  test("waits for later openings and never revisits a room across multiple windows", () => {
    const result = plan([
      room("A", [
        [0, 20],
        [40, 60],
      ]),
      room("B", [[30, 60]]),
    ]);
    expect(result.stops).toHaveLength(2);
    expect(result.stops[1]).toMatchObject({ arrival: 20, start: 30, end: 50, remaining: 10 });
  });

  test("handles absolute next-day minutes and rejects a visit that would overrun", () => {
    const result = plan([room("A", [[1430, 1460]]), room("B", [[1460, 1470]])], 1430, 1470, 20);
    expect(result.stops).toHaveLength(1);
    expect(result.stops[0]?.end).toBe(1450);
    expect(plan([room("A", [[0, 60]])], 0, 60, 0).stops).toEqual([]);
  });
});
