import { describe, expect, test } from "bun:test";
import {
  HOTLINE_DAYS,
  HOTLINE_SLOTS,
  HotlineScheduleInfeasibleError,
  type HotlineSolverProfile,
  isProfileEligible,
  solveHotlineSchedule,
} from "../../lib/hotline/solver.ts";

type Workday = NonNullable<HotlineSolverProfile["availabilityProfile"]["monday"]>;
const MINUTES_PER_HOUR = 60;
const COVERAGE_START_HOUR = 8;
const TARGET_AVAILABLE_EMPLOYEES = 2;
const LAST_AVAILABLE_THRESHOLD = 3;
const TEST_TIMEOUT_MS = 30_000;

const workday = (start: string, end: string, blockages: Workday["blockages"]): Workday => ({
  blockages,
  shift: { end, start },
});

const weekdaySchedule = (day: Workday) => ({
  friday: structuredClone(day),
  monday: structuredClone(day),
  thursday: structuredClone(day),
  tuesday: structuredClone(day),
  wednesday: structuredClone(day),
});

const profiles: HotlineSolverProfile[] = [
  {
    availabilityProfile: weekdaySchedule(workday("08:30", "17:00", [{ end: "12:30", start: "12:00" }])),
    displayName: "Anthony",
    enabled: true,
    profileId: "anthony",
    schedulingClass: "RESERVE",
  },
  {
    availabilityProfile: {
      friday: workday("08:00", "17:00", [{ end: "12:00", start: "11:00" }]),
      monday: workday("08:00", "17:00", [{ end: "12:00", start: "11:00" }]),
      thursday: workday("07:30", "16:30", [{ end: "12:00", start: "11:00" }]),
      tuesday: null,
      wednesday: workday("08:00", "17:00", [{ end: "12:00", start: "11:00" }]),
    },
    displayName: "Matt",
    enabled: true,
    profileId: "matt",
    schedulingClass: "STANDARD",
  },
  {
    availabilityProfile: {
      friday: workday("07:30", "18:30", [{ end: "14:00", start: "13:00" }]),
      monday: workday("07:30", "18:30", [{ end: "14:00", start: "13:00" }]),
      thursday: null,
      tuesday: workday("07:30", "18:30", [{ end: "14:00", start: "13:00" }]),
      wednesday: workday("07:30", "18:30", [{ end: "14:00", start: "13:00" }]),
    },
    displayName: "Manuel",
    enabled: true,
    profileId: "manuel",
    schedulingClass: "STANDARD",
  },
  {
    availabilityProfile: weekdaySchedule(workday("11:00", "20:00", [{ end: "16:30", start: "15:00" }])),
    displayName: "Israel",
    enabled: true,
    profileId: "israel",
    schedulingClass: "STANDARD",
  },
];

const toMinutes = (time: string) => {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * MINUTES_PER_HOUR + Number(minutes);
};

const isInRanges = (start: number, ranges: Array<{ start: string; end: string }>) =>
  ranges.some((range) => start >= toMinutes(range.start) && start < toMinutes(range.end));

const baselinePromise = solveHotlineSchedule(structuredClone(profiles), { maxTimeInSeconds: 10 });

describe("hotline CP-SAT scheduler", () => {
  test(
    "satisfies coverage, focus, reserve, and solo constraints",
    async () => {
      const result = await baselinePromise;
      const schedules = new Map(result.schedules.map((entry) => [entry.profileId, entry.schedule]));

      for (const day of HOTLINE_DAYS) {
        for (const start of HOTLINE_SLOTS) {
          const eligible = profiles.filter((profile) => isProfileEligible(profile, day, start));
          let availableCount = 0;
          let lastAvailableCount = 0;

          for (const profile of profiles) {
            const generatedDay = schedules.get(profile.profileId)?.schedule[day];
            const isAvailable = generatedDay ? isInRanges(start, [...generatedDay.available, ...generatedDay.solo]) : false;
            const isLastAvailable = generatedDay ? isInRanges(start, generatedDay.lastAvailable) : false;
            if (!isProfileEligible(profile, day, start)) expect(isAvailable || isLastAvailable).toBeFalse();
            availableCount += Number(isAvailable);
            lastAvailableCount += Number(isLastAvailable);

            if (profile.schedulingClass === "RESERVE" && isProfileEligible(profile, day, start)) {
              const eligibleStandardCount = eligible.filter((employee) => employee.schedulingClass === "STANDARD").length;
              if (eligibleStandardCount >= LAST_AVAILABLE_THRESHOLD) expect(isAvailable || isLastAvailable).toBeFalse();
              if (eligibleStandardCount === TARGET_AVAILABLE_EMPLOYEES) expect(isLastAvailable).toBeTrue();
            }
          }

          expect(availableCount).toBe(Math.min(TARGET_AVAILABLE_EMPLOYEES, eligible.length));
          expect(lastAvailableCount).toBe(eligible.length >= LAST_AVAILABLE_THRESHOLD ? 1 : 0);
        }
      }

      const manuelTuesday = schedules.get("manuel")?.schedule.tuesday;
      expect(manuelTuesday && isInRanges(COVERAGE_START_HOUR * MINUTES_PER_HOUR, manuelTuesday.solo)).toBeTrue();
    },
    TEST_TIMEOUT_MS
  );

  test(
    "returns the identical assignment when inputs have not changed",
    async () => {
      const baseline = await baselinePromise;
      const previousByProfile = new Map(baseline.schedules.map((entry) => [entry.profileId, entry.schedule]));
      const withPreviousSchedule = profiles.map((profile) => ({
        ...structuredClone(profile),
        generatedWeeklySchedule: previousByProfile.get(profile.profileId),
      }));

      const repeated = await solveHotlineSchedule(withPreviousSchedule, { maxTimeInSeconds: 10 });
      expect(repeated.metrics.changedAssignments).toBe(0);
      expect(repeated.schedules.map((entry) => entry.schedule.schedule)).toEqual(baseline.schedules.map((entry) => entry.schedule.schedule));
    },
    TEST_TIMEOUT_MS
  );

  test(
    "changes only the forced assignment when one new blockage is added",
    async () => {
      const baseline = await baselinePromise;
      const previousByProfile = new Map(baseline.schedules.map((entry) => [entry.profileId, entry.schedule]));
      const changedProfiles = profiles.map((profile) => ({
        ...structuredClone(profile),
        generatedWeeklySchedule: previousByProfile.get(profile.profileId),
      }));
      const matt = changedProfiles.find((profile) => profile.profileId === "matt");
      const mattMonday = matt?.availabilityProfile.monday;
      if (!mattMonday) throw new Error("Matt's Monday fixture is missing.");
      mattMonday.blockages.push({ end: "08:30", start: "08:00" });

      const changed = await solveHotlineSchedule(changedProfiles, { maxTimeInSeconds: 10 });
      expect(changed.metrics.changedAssignments).toBe(1);
    },
    TEST_TIMEOUT_MS
  );

  test("reports a useful infeasibility before invoking CP-SAT", async () => {
    const uncovered = structuredClone(profiles);
    for (const profile of uncovered) profile.availabilityProfile.monday = null;

    await expect(solveHotlineSchedule(uncovered)).rejects.toBeInstanceOf(HotlineScheduleInfeasibleError);
    await expect(solveHotlineSchedule(uncovered)).rejects.toThrow("monday at 8:00 AM");
  });
});
