import { withSystemFields, zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import { internalMutation, internalQuery } from "../../../lib/procedures.ts";
import { generatedWeeklyScheduleSchema, hotlineStaffProfile } from "./schemas.ts";

const hotlineStaffProfileDoc = z.object(withSystemFields("hotlineProfiles", hotlineStaffProfile.shape));

export const getSolverSnapshot = internalQuery({
  args: z.object({ inputVersion: z.number().int().nonnegative() }),
  returns: z
    .object({
      inputVersion: z.number().int().nonnegative(),
      profiles: z.array(hotlineStaffProfileDoc),
    })
    .nullable(),
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("hotlineScheduleState")
      .withIndex("byKey", (query) => query.eq("key", "current"))
      .unique();
    if (!state || state.inputVersion !== args.inputVersion) return null;

    return {
      inputVersion: state.inputVersion,
      profiles: await ctx.db.query("hotlineProfiles").withIndex("byEmail").collect(),
    };
  },
});

export const markSolving = internalMutation({
  args: z.object({ inputVersion: z.number().int().nonnegative() }),
  returns: z.boolean(),
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("hotlineScheduleState")
      .withIndex("byKey", (query) => query.eq("key", "current"))
      .unique();
    if (!state || state.inputVersion !== args.inputVersion) return false;

    await ctx.db.patch("hotlineScheduleState", state._id, {
      completedAt: null,
      error: null,
      scheduledFunctionId: null,
      startedAt: Date.now(),
      status: "SOLVING",
    });
    return true;
  },
});

export const publishGeneratedSchedules = internalMutation({
  args: z.object({
    inputVersion: z.number().int().nonnegative(),
    schedules: z.array(
      z.object({
        profileId: zid("hotlineProfiles"),
        schedule: generatedWeeklyScheduleSchema,
      })
    ),
  }),
  returns: z.boolean(),
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("hotlineScheduleState")
      .withIndex("byKey", (query) => query.eq("key", "current"))
      .unique();
    if (!state || state.inputVersion !== args.inputVersion) return false;

    const profiles = await ctx.db.query("hotlineProfiles").collect();
    const generatedProfileIds = new Set(args.schedules.map((generated) => generated.profileId));
    if (
      generatedProfileIds.size !== args.schedules.length ||
      profiles.length !== args.schedules.length ||
      profiles.some((profile) => !generatedProfileIds.has(profile._id))
    ) {
      return false;
    }

    for (const generated of args.schedules) {
      await ctx.db.patch("hotlineProfiles", generated.profileId, {
        generatedWeeklySchedule: {
          ...generated.schedule,
          generatedFromVersion: args.inputVersion,
        },
      });
    }

    await ctx.db.patch("hotlineScheduleState", state._id, {
      completedAt: Date.now(),
      error: null,
      publishedVersion: args.inputVersion,
      scheduledFunctionId: null,
      status: "READY",
    });
    return true;
  },
});

export const recordScheduleFailure = internalMutation({
  args: z.object({
    error: z.string(),
    inputVersion: z.number().int().nonnegative(),
    status: z.enum(["INFEASIBLE", "FAILED"]),
  }),
  returns: z.boolean(),
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("hotlineScheduleState")
      .withIndex("byKey", (query) => query.eq("key", "current"))
      .unique();
    if (!state || state.inputVersion !== args.inputVersion) return false;

    await ctx.db.patch("hotlineScheduleState", state._id, {
      completedAt: Date.now(),
      error: args.error,
      scheduledFunctionId: null,
      status: args.status,
    });
    return true;
  },
});
