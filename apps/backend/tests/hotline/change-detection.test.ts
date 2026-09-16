import { describe, expect, test } from "bun:test";
import { didHotlineSolverInputChange, type HotlineSolverInput } from "../../lib/hotline/change-detection.ts";

type FixtureInput = HotlineSolverInput & {
  availabilityProfile: {
    friday: null;
    monday: {
      blockages: Array<{ end: string; start: string }>;
      shift: { end: string; start: string };
    };
    thursday: null;
    tuesday: null;
    wednesday: null;
  };
};

const baseline: FixtureInput = {
  availabilityProfile: {
    friday: null,
    monday: { blockages: [{ end: "12:30", start: "12:00" }], shift: { end: "17:00", start: "08:00" } },
    thursday: null,
    tuesday: null,
    wednesday: null,
  },
  enabled: true,
  schedulingClass: "STANDARD",
};

describe("hotline solver input change detection", () => {
  test("ignores a structurally identical submission", () => {
    expect(didHotlineSolverInputChange(baseline, structuredClone(baseline))).toBeFalse();
  });

  test("detects availability, reserve, and enabled-state changes", () => {
    const availabilityChanged = structuredClone(baseline);
    availabilityChanged.availabilityProfile.monday.blockages.push({ end: "15:00", start: "14:30" });

    expect(didHotlineSolverInputChange(baseline, availabilityChanged)).toBeTrue();
    expect(didHotlineSolverInputChange(baseline, { ...structuredClone(baseline), schedulingClass: "RESERVE" })).toBeTrue();
    expect(didHotlineSolverInputChange(baseline, { ...structuredClone(baseline), enabled: false })).toBeTrue();
  });
});
