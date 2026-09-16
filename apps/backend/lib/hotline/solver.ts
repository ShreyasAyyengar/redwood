import { type BoolVar, CpModel, CpSolver, CpSolverStatus, LinearExpr } from "cpsat-js/portable";
import type { z } from "zod";
import type { generatedWeeklyScheduleSchema, hotlineStaffProfile } from "../../convex/core/hotline/schedule/schemas.ts";

export const HOTLINE_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_HALF_DAY = 12;
const HOTLINE_START_HOUR = 8;
const HOTLINE_END_HOUR = 20;
const MAXIMUM_BREAK_DISTANCE = 6;
const TARGET_AVAILABLE_EMPLOYEES = 2;
const LAST_AVAILABLE_THRESHOLD = 3;
const DEFAULT_SOLVE_SECONDS = 15;
export const HOTLINE_SLOT_MINUTES = 30;
export const HOTLINE_START_MINUTES = HOTLINE_START_HOUR * MINUTES_PER_HOUR;
export const HOTLINE_END_MINUTES = HOTLINE_END_HOUR * MINUTES_PER_HOUR;
export const HOTLINE_SLOTS = Array.from(
  { length: (HOTLINE_END_MINUTES - HOTLINE_START_MINUTES) / HOTLINE_SLOT_MINUTES },
  (_, index) => HOTLINE_START_MINUTES + index * HOTLINE_SLOT_MINUTES
);

type Day = (typeof HOTLINE_DAYS)[number];
type StaffProfile = z.infer<typeof hotlineStaffProfile>;
export type GeneratedWeeklySchedule = z.infer<typeof generatedWeeklyScheduleSchema>;
export type HotlineSolverProfile = Pick<
  StaffProfile,
  "availabilityProfile" | "displayName" | "enabled" | "generatedWeeklySchedule" | "schedulingClass"
> & {
  profileId: string;
};

type AssignmentVariables = {
  available: BoolVar;
  lastAvailable: BoolVar;
};

export type HotlineSolverMetrics = {
  changedAssignments: number;
  fairnessRange: number;
  objectiveValue: number;
  proximityCost: number;
  status: "FEASIBLE" | "OPTIMAL";
  transitions: number;
  wallTimeSeconds: number;
};

export type HotlineSolverResult = {
  metrics: HotlineSolverMetrics;
  schedules: Array<{ profileId: string; schedule: GeneratedWeeklySchedule }>;
};

export class HotlineScheduleInfeasibleError extends Error {
  override readonly name = "HotlineScheduleInfeasibleError";
}

const toMinutes = (time: string) => {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * MINUTES_PER_HOUR + Number(minutes);
};

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / MINUTES_PER_HOUR)).padStart(2, "0")}:${String(minutes % MINUTES_PER_HOUR).padStart(2, "0")}`;

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  return `${hours % HOURS_PER_HALF_DAY || HOURS_PER_HALF_DAY}:${String(minutes % MINUTES_PER_HOUR).padStart(2, "0")} ${hours < HOURS_PER_HALF_DAY ? "AM" : "PM"}`;
};

const assignmentKey = (employeeIndex: number, day: Day, slotIndex: number) => `${employeeIndex}:${day}:${slotIndex}`;

const isWithinRange = (start: number, range: { start: string; end: string }) => start >= toMinutes(range.start) && start < toMinutes(range.end);

export const isProfileEligible = (profile: HotlineSolverProfile, day: Day, start: number) => {
  if (!profile.enabled) return false;
  const daySchedule = profile.availabilityProfile[day];
  if (!daySchedule || !isWithinRange(start, daySchedule.shift)) return false;
  return !daySchedule.blockages.some((blockage) => isWithinRange(start, blockage));
};

const distanceFromBreak = (profile: HotlineSolverProfile, day: Day, start: number) => {
  const blockages = profile.availabilityProfile[day]?.blockages ?? [];
  if (blockages.length === 0) return 0;

  const end = start + HOTLINE_SLOT_MINUTES;
  return Math.min(
    ...blockages.map((blockage) => {
      const breakStart = toMinutes(blockage.start);
      const breakEnd = toMinutes(blockage.end);
      if (end <= breakStart) return Math.ceil((breakStart - end) / HOTLINE_SLOT_MINUTES);
      if (start >= breakEnd) return Math.ceil((start - breakEnd) / HOTLINE_SLOT_MINUTES);
      return 0;
    }),
    MAXIMUM_BREAK_DISTANCE
  );
};

const sumVariables = (variables: BoolVar[]) =>
  variables.reduce((total, variable) => total.plus(variable.toLinearExpr()), LinearExpr.fromConstant(0));

const sumExpressions = (expressions: LinearExpr[]) =>
  expressions.reduce((total, expression) => total.plus(expression), LinearExpr.fromConstant(0));

const wasAssigned = (profile: HotlineSolverProfile, day: Day, start: number, state: "available" | "lastAvailable") => {
  const previousDay = profile.generatedWeeklySchedule?.schedule[day];
  if (!previousDay) return false;
  if (state === "lastAvailable") return previousDay.lastAvailable.some((range) => isWithinRange(start, range));
  return [...previousDay.available, ...previousDay.solo].some((range) => isWithinRange(start, range));
};

const compressSlots = (selected: boolean[]) => {
  const ranges: Array<{ start: string; end: string }> = [];
  let rangeStart: number | undefined;

  for (let index = 0; index <= selected.length; index += 1) {
    if (selected[index] && rangeStart === undefined) rangeStart = index;
    if (!selected[index] && rangeStart !== undefined) {
      ranges.push({
        start: toTime(HOTLINE_START_MINUTES + rangeStart * HOTLINE_SLOT_MINUTES),
        end: toTime(HOTLINE_START_MINUTES + index * HOTLINE_SLOT_MINUTES),
      });
      rangeStart = undefined;
    }
  }

  return ranges;
};

function getAssignment(assignments: Map<string, AssignmentVariables>, employeeIndex: number, day: Day, slotIndex: number) {
  const assignment = assignments.get(assignmentKey(employeeIndex, day, slotIndex));
  if (!assignment) throw new Error("Hotline assignment variables were not created.");
  return assignment;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: the constraint model is clearer when its variables, constraints, and objective remain together.
export async function solveHotlineSchedule(
  profiles: HotlineSolverProfile[],
  options: { maxTimeInSeconds?: number } = {}
): Promise<HotlineSolverResult> {
  const enabledProfiles = profiles.filter((profile) => profile.enabled);
  if (enabledProfiles.length === 0) throw new HotlineScheduleInfeasibleError("No enabled hotline staff profiles exist.");

  const reserveIndexes = profiles
    .map((profile, employeeIndex) => ({ employeeIndex, profile }))
    .filter(({ profile }) => profile.enabled && profile.schedulingClass === "RESERVE")
    .map(({ employeeIndex }) => employeeIndex);
  if (reserveIndexes.length > 1) {
    throw new HotlineScheduleInfeasibleError("Only one enabled employee can be on hotline reserve.");
  }
  const [reserveIndex] = reserveIndexes;

  const model = new CpModel("redwood_hotline_schedule");
  const assignments = new Map<string, AssignmentVariables>();
  const eligibleCounts = new Map<string, number>();
  const changedExpressions: LinearExpr[] = [];

  for (const day of HOTLINE_DAYS) {
    for (const [slotIndex, start] of HOTLINE_SLOTS.entries()) {
      const eligibleEmployeeIndexes = profiles
        .map((profile, employeeIndex) => ({ employeeIndex, profile }))
        .filter(({ profile }) => isProfileEligible(profile, day, start))
        .map(({ employeeIndex }) => employeeIndex);
      eligibleCounts.set(`${day}:${slotIndex}`, eligibleEmployeeIndexes.length);

      if (eligibleEmployeeIndexes.length === 0) {
        throw new HotlineScheduleInfeasibleError(`No hotline coverage is possible on ${day} at ${formatTime(start)}.`);
      }

      const availableVariables: BoolVar[] = [];
      const lastAvailableVariables: BoolVar[] = [];

      for (const [employeeIndex, profile] of profiles.entries()) {
        const available = model.newBoolVar(`available_${day}_${slotIndex}_${employeeIndex}`);
        const lastAvailable = model.newBoolVar(`last_available_${day}_${slotIndex}_${employeeIndex}`);
        assignments.set(assignmentKey(employeeIndex, day, slotIndex), { available, lastAvailable });

        model.add(available.plus(lastAvailable).le(1));
        if (!eligibleEmployeeIndexes.includes(employeeIndex)) {
          model.add(available.equals(0));
          model.add(lastAvailable.equals(0));
        }

        if (profile.generatedWeeklySchedule) {
          const previousAvailable = wasAssigned(profile, day, start, "available") ? 1 : 0;
          const previousLastAvailable = wasAssigned(profile, day, start, "lastAvailable") ? 1 : 0;
          model.addHint(available, previousAvailable);
          model.addHint(lastAvailable, previousLastAvailable);
          changedExpressions.push(
            previousAvailable === 1 ? LinearExpr.fromConstant(1).minus(available.toLinearExpr()) : available.toLinearExpr(),
            previousLastAvailable === 1 ? LinearExpr.fromConstant(1).minus(lastAvailable.toLinearExpr()) : lastAvailable.toLinearExpr()
          );
        }

        availableVariables.push(available);
        lastAvailableVariables.push(lastAvailable);
      }

      model.add(sumVariables(availableVariables).equals(Math.min(TARGET_AVAILABLE_EMPLOYEES, eligibleEmployeeIndexes.length)));
      model.add(sumVariables(lastAvailableVariables).equals(eligibleEmployeeIndexes.length >= LAST_AVAILABLE_THRESHOLD ? 1 : 0));

      if (reserveIndex !== undefined && eligibleEmployeeIndexes.includes(reserveIndex)) {
        const eligibleStandardCount = eligibleEmployeeIndexes.filter((employeeIndex) => employeeIndex !== reserveIndex).length;
        const reserve = getAssignment(assignments, reserveIndex, day, slotIndex);
        if (eligibleStandardCount >= LAST_AVAILABLE_THRESHOLD) {
          model.add(reserve.available.equals(0));
          model.add(reserve.lastAvailable.equals(0));
        } else if (eligibleStandardCount === 2) {
          model.add(reserve.available.equals(0));
          model.add(reserve.lastAvailable.equals(1));
        }
      }
    }
  }

  const standardEmployeeIndexes = profiles
    .map((profile, employeeIndex) => ({ employeeIndex, profile }))
    .filter(({ profile }) => profile.enabled && profile.schedulingClass === "STANDARD")
    .map(({ employeeIndex }) => employeeIndex);

  const lastAvailableTotals = standardEmployeeIndexes.map((employeeIndex) => {
    const total = model.newIntVar(0, HOTLINE_DAYS.length * HOTLINE_SLOTS.length, `last_total_${employeeIndex}`);
    const variables = HOTLINE_DAYS.flatMap((day) =>
      HOTLINE_SLOTS.map((_, slotIndex) => getAssignment(assignments, employeeIndex, day, slotIndex).lastAvailable)
    );
    model.add(total.equals(sumVariables(variables)));
    return total;
  });

  let fairnessRange = LinearExpr.fromConstant(0);
  if (lastAvailableTotals.length >= 2) {
    const maximum = model.newIntVar(0, HOTLINE_DAYS.length * HOTLINE_SLOTS.length, "maximum_last_available");
    const minimum = model.newIntVar(0, HOTLINE_DAYS.length * HOTLINE_SLOTS.length, "minimum_last_available");
    for (const total of lastAvailableTotals) {
      model.add(maximum.ge(total));
      model.add(minimum.le(total));
    }
    fairnessRange = maximum.minus(minimum);
  }

  const transitions: BoolVar[] = [];
  let proximityCost = LinearExpr.fromConstant(0);
  for (const employeeIndex of standardEmployeeIndexes) {
    const profile = profiles[employeeIndex];
    if (!profile) throw new Error("A standard hotline profile could not be found.");
    for (const day of HOTLINE_DAYS) {
      const dailyLastAvailable = HOTLINE_SLOTS.map((start, slotIndex) => {
        const variable = getAssignment(assignments, employeeIndex, day, slotIndex).lastAvailable;
        proximityCost = proximityCost.plus(variable.times(distanceFromBreak(profile, day, start)));
        return variable;
      });

      const [first] = dailyLastAvailable;
      const last = dailyLastAvailable.at(-1);
      if (first && last) transitions.push(first, last);
      for (let slotIndex = 1; slotIndex < dailyLastAvailable.length; slotIndex += 1) {
        const previous = dailyLastAvailable.at(slotIndex - 1);
        const current = dailyLastAvailable.at(slotIndex);
        if (!previous || !current) throw new Error("A hotline transition variable could not be found.");
        const changed = model.newBoolVar(`last_changed_${day}_${slotIndex}_${employeeIndex}`);
        model.add(changed.ge(current.minus(previous)));
        model.add(changed.ge(previous.minus(current)));
        transitions.push(changed);
      }
    }
  }

  const maximumProximity = BigInt(standardEmployeeIndexes.length * HOTLINE_DAYS.length * HOTLINE_SLOTS.length * MAXIMUM_BREAK_DISTANCE);
  const transitionWeight = maximumProximity + 1n;
  const maximumTransitions = BigInt(standardEmployeeIndexes.length * HOTLINE_DAYS.length * (HOTLINE_SLOTS.length + 1));
  const maximumAestheticCost = maximumTransitions * transitionWeight + maximumProximity;
  const churnWeight = maximumAestheticCost + 1n;
  const maximumChurn = BigInt(changedExpressions.length);
  const fairnessWeight = maximumChurn * churnWeight + maximumAestheticCost + 1n;
  const changedAssignments = sumExpressions(changedExpressions);
  const transitionCost = sumVariables(transitions);

  model.minimize(
    fairnessRange
      .times(fairnessWeight)
      .plus(changedAssignments.times(churnWeight))
      .plus(transitionCost.times(transitionWeight))
      .plus(proximityCost)
  );

  const solver = await CpSolver.create();
  const result = solver.solve(model, {
    maxTimeInSeconds: options.maxTimeInSeconds ?? DEFAULT_SOLVE_SECONDS,
    numWorkers: 1,
  });

  if (result.status !== CpSolverStatus.OPTIMAL && result.status !== CpSolverStatus.FEASIBLE) {
    throw new HotlineScheduleInfeasibleError(`Could not create a hotline schedule: ${CpSolverStatus[result.status]}.`);
  }

  const generatedAt = Date.now();
  const schedules = profiles.map((profile, employeeIndex) => ({
    profileId: profile.profileId,
    schedule: {
      generatedAt,
      schedule: Object.fromEntries(
        HOTLINE_DAYS.map((day) => {
          const availability = profile.availabilityProfile[day];
          if (!profile.enabled || !availability) return [day, null];

          const available: boolean[] = [];
          const lastAvailable: boolean[] = [];
          const solo: boolean[] = [];
          for (const [slotIndex] of HOTLINE_SLOTS.entries()) {
            const assignment = getAssignment(assignments, employeeIndex, day, slotIndex);
            const isAvailable = result.value(assignment.available) === 1;
            available.push(isAvailable && eligibleCounts.get(`${day}:${slotIndex}`) !== 1);
            solo.push(isAvailable && eligibleCounts.get(`${day}:${slotIndex}`) === 1);
            lastAvailable.push(result.value(assignment.lastAvailable) === 1);
          }

          return [
            day,
            {
              available: compressSlots(available),
              breaks: availability.blockages,
              lastAvailable: compressSlots(lastAvailable),
              solo: compressSlots(solo),
            },
          ];
        })
      ) as GeneratedWeeklySchedule["schedule"],
    },
  }));

  const lastAvailableValues = lastAvailableTotals.map((total) => result.value(total));
  let changedAssignmentCount = 0;
  let proximityResult = 0;
  for (const [employeeIndex, profile] of profiles.entries()) {
    for (const day of HOTLINE_DAYS) {
      for (const [slotIndex, start] of HOTLINE_SLOTS.entries()) {
        const assignment = getAssignment(assignments, employeeIndex, day, slotIndex);
        const availableValue = result.value(assignment.available);
        const lastAvailableValue = result.value(assignment.lastAvailable);
        if (profile.generatedWeeklySchedule) {
          changedAssignmentCount += Math.abs(availableValue - Number(wasAssigned(profile, day, start, "available")));
          changedAssignmentCount += Math.abs(lastAvailableValue - Number(wasAssigned(profile, day, start, "lastAvailable")));
        }
        if (profile.enabled && profile.schedulingClass === "STANDARD") {
          proximityResult += lastAvailableValue * distanceFromBreak(profile, day, start);
        }
      }
    }
  }

  return {
    metrics: {
      changedAssignments: changedAssignmentCount,
      fairnessRange: lastAvailableValues.length < 2 ? 0 : Math.max(...lastAvailableValues) - Math.min(...lastAvailableValues),
      objectiveValue: result.objectiveValue,
      proximityCost: proximityResult,
      status: result.status === CpSolverStatus.OPTIMAL ? "OPTIMAL" : "FEASIBLE",
      transitions: transitions.reduce((total, variable) => total + result.value(variable), 0),
      wallTimeSeconds: result.wallTime,
    },
    schedules,
  };
}
