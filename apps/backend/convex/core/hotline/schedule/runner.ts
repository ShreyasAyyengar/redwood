"use node";

import { z } from "zod";
import { HotlineScheduleInfeasibleError, solveHotlineSchedule } from "../../../../lib/hotline/solver.ts";
import { internal } from "../../../_generated/api";
import type { Doc } from "../../../_generated/dataModel.ts";
import { internalAction } from "../../../lib/procedures.ts";

const resultStatus = z.enum(["STALE", "READY", "INFEASIBLE", "FAILED"]);
const MAXIMUM_ERROR_LENGTH = 1000;
type RecomputeResult = { status: z.infer<typeof resultStatus> };
type SolverSnapshot = { inputVersion: number; profiles: Doc<"hotlineProfiles">[] };

export const recomputeHotlineSchedule = internalAction({
  args: z.object({ inputVersion: z.number().int().nonnegative() }),
  returns: z.object({ status: resultStatus }),
  handler: async (ctx, args): Promise<RecomputeResult> => {
    const snapshot: SolverSnapshot | null = await ctx.runQuery(internal.core.hotline.schedule.internal.getSolverSnapshot, args);
    if (!snapshot) return { status: "STALE" as const };

    const started = await ctx.runMutation(internal.core.hotline.schedule.internal.markSolving, args);
    if (!started) return { status: "STALE" as const };

    try {
      const result = await solveHotlineSchedule(
        snapshot.profiles.map((profile) => ({
          profileId: profile._id,
          availabilityProfile: profile.availabilityProfile,
          displayName: profile.displayName,
          enabled: profile.enabled,
          generatedWeeklySchedule: profile.generatedWeeklySchedule,
          schedulingClass: profile.schedulingClass,
        }))
      );

      const published: boolean = await ctx.runMutation(internal.core.hotline.schedule.internal.publishGeneratedSchedules, {
        inputVersion: args.inputVersion,
        schedules: result.schedules,
      });
      return { status: published ? ("READY" as const) : ("STALE" as const) };
    } catch (error) {
      const status = error instanceof HotlineScheduleInfeasibleError ? "INFEASIBLE" : "FAILED";
      const message = error instanceof Error ? error.message : String(error);
      const recorded: boolean = await ctx.runMutation(internal.core.hotline.schedule.internal.recordScheduleFailure, {
        error: message.slice(0, MAXIMUM_ERROR_LENGTH),
        inputVersion: args.inputVersion,
        status,
      });
      return { status: (recorded ? status : "STALE") as z.infer<typeof resultStatus> };
    }
  },
});
