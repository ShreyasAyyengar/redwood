import { ConvexError } from "convex/values";
import { withSystemFields, zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import { didHotlineSolverInputChange } from "../../../../lib/hotline/change-detection.ts";
import { internal } from "../../../_generated/api";
import type { Id } from "../../../_generated/dataModel.ts";
import type { MutationCtx } from "../../../_generated/server.ts";
import { authComponent } from "../../../auth.ts";
import { protectedMutation, protectedQuery, supervisorMutation } from "../../../lib/procedures.ts";
import { hotlineScheduleStateSchema, hotlineStaffProfile, weeklyAvailabilityProfileSchema } from "./schemas.ts";

const RECOMPUTE_DEBOUNCE_MS = 400;

export const hotlineStaffProfileDoc = z.object(withSystemFields("hotlineProfiles", hotlineStaffProfile.shape));
export const hotlineScheduleStateDoc = z.object(withSystemFields("hotlineScheduleState", hotlineScheduleStateSchema.shape));

const selfServiceProfileFields = z.object({
  availabilityProfile: weeklyAvailabilityProfileSchema,
  displayName: z.string().trim().min(1, "Enter your name."),
  schedulingClass: hotlineStaffProfile.shape.schedulingClass,
});

const mutationResult = z.object({
  changed: z.boolean(),
  inputVersion: z.number().int().nonnegative().nullable(),
  success: z.boolean(),
});

async function assertSingleEnabledReserve(
  ctx: MutationCtx,
  profileId: Id<"hotlineProfiles"> | undefined,
  schedulingClass: "STANDARD" | "RESERVE",
  enabled: boolean
) {
  if (schedulingClass !== "RESERVE" || !enabled) return;

  const profiles = await ctx.db.query("hotlineProfiles").collect();
  const otherReserve = profiles.find((profile) => profile._id !== profileId && profile.enabled && profile.schedulingClass === "RESERVE");
  if (otherReserve) {
    throw new ConvexError({
      code: "CONFLICT",
      message: `${otherReserve.displayName} is already the enabled hotline reserve.`,
    });
  }
}

async function enqueueScheduleRecomputation(ctx: MutationCtx) {
  const current = await ctx.db
    .query("hotlineScheduleState")
    .withIndex("byKey", (query) => query.eq("key", "current"))
    .unique();

  if (current?.scheduledFunctionId) {
    try {
      await ctx.scheduler.cancel(current.scheduledFunctionId as Id<"_scheduled_functions">);
    } catch {
      // A started or completed action cannot always be canceled. The input-version
      // check in the publisher still prevents it from committing stale output.
    }
  }

  const inputVersion = (current?.inputVersion ?? 0) + 1;
  const scheduledFunctionId = await ctx.scheduler.runAfter(
    RECOMPUTE_DEBOUNCE_MS,
    internal.core.hotline.schedule.runner.recomputeHotlineSchedule,
    { inputVersion }
  );
  const nextState = {
    completedAt: null,
    error: null,
    inputVersion,
    key: "current" as const,
    publishedVersion: current?.publishedVersion ?? 0,
    scheduledFunctionId,
    startedAt: null,
    status: "PENDING" as const,
  };

  if (current) await ctx.db.replace("hotlineScheduleState", current._id, nextState);
  else await ctx.db.insert("hotlineScheduleState", nextState);

  return inputVersion;
}

export const getHotlineStaffProfiles = protectedQuery({
  returns: z.array(hotlineStaffProfileDoc),
  handler: (ctx) => ctx.db.query("hotlineProfiles").withIndex("byEmail").collect(),
});

export const getHotlineScheduleState = protectedQuery({
  returns: hotlineScheduleStateDoc.nullable(),
  handler: (ctx) =>
    ctx.db
      .query("hotlineScheduleState")
      .withIndex("byKey", (query) => query.eq("key", "current"))
      .unique(),
});

export const getHotlineStaffProfile = protectedQuery({
  args: z.object({ _id: zid("hotlineProfiles") }),
  returns: hotlineStaffProfileDoc,
  handler: async (ctx, args) => {
    const profile = await ctx.db.get("hotlineProfiles", args._id);
    if (!profile) {
      throw new ConvexError({ code: "NOT_FOUND", message: `Hotline staff profile with id ${args._id} not found` });
    }

    return profile;
  },
});

export const getCurrentHotlineStaffProfile = protectedQuery({
  returns: hotlineStaffProfileDoc.nullable(),
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    return ctx.db
      .query("hotlineProfiles")
      .withIndex("byEmail", (query) => query.eq("email", user.email))
      .first();
  },
});

export const saveCurrentHotlineStaffProfile = protectedMutation({
  args: selfServiceProfileFields,
  returns: mutationResult,
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const existingProfile = await ctx.db
      .query("hotlineProfiles")
      .withIndex("byEmail", (query) => query.eq("email", user.email))
      .first();

    await assertSingleEnabledReserve(ctx, existingProfile?._id, args.schedulingClass, existingProfile?.enabled ?? true);

    const solverInputChanged =
      !existingProfile ||
      didHotlineSolverInputChange(existingProfile, {
        availabilityProfile: args.availabilityProfile,
        enabled: existingProfile.enabled,
        schedulingClass: args.schedulingClass,
      });
    const recordChanged = solverInputChanged || !existingProfile || existingProfile.displayName !== args.displayName;

    if (recordChanged && existingProfile) {
      await ctx.db.patch("hotlineProfiles", existingProfile._id, args);
    } else if (!existingProfile) {
      await ctx.db.insert("hotlineProfiles", {
        ...args,
        email: user.email,
        enabled: true,
      });
    }

    const inputVersion = solverInputChanged ? await enqueueScheduleRecomputation(ctx) : null;
    return { changed: solverInputChanged, inputVersion, success: true };
  },
});

export const updateHotlineStaffProfile = supervisorMutation({
  args: hotlineStaffProfile
    .pick({ availabilityProfile: true, displayName: true, enabled: true, schedulingClass: true })
    .partial()
    .extend({ _id: zid("hotlineProfiles") }),
  returns: mutationResult,
  handler: async (ctx, args) => {
    const profile = await ctx.db.get("hotlineProfiles", args._id);
    if (!profile) {
      throw new ConvexError({ code: "NOT_FOUND", message: `Hotline staff profile with id ${args._id} not found` });
    }

    const { _id, ...updates } = args;
    const nextSchedulingClass = updates.schedulingClass ?? profile.schedulingClass;
    const nextEnabled = updates.enabled ?? profile.enabled;
    await assertSingleEnabledReserve(ctx, _id, nextSchedulingClass, nextEnabled);

    const solverInputChanged = didHotlineSolverInputChange(profile, {
      availabilityProfile: updates.availabilityProfile ?? profile.availabilityProfile,
      enabled: nextEnabled,
      schedulingClass: nextSchedulingClass,
    });
    const recordChanged = solverInputChanged || (updates.displayName !== undefined && updates.displayName !== profile.displayName);

    if (recordChanged) await ctx.db.patch("hotlineProfiles", _id, updates);
    const inputVersion = solverInputChanged ? await enqueueScheduleRecomputation(ctx) : null;
    return { changed: solverInputChanged, inputVersion, success: true };
  },
});

export const deleteHotlineStaffProfile = supervisorMutation({
  args: z.object({ _id: zid("hotlineProfiles") }),
  returns: mutationResult,
  handler: async (ctx, args) => {
    const profile = await ctx.db.get("hotlineProfiles", args._id);
    if (!profile) {
      throw new ConvexError({ code: "NOT_FOUND", message: `Hotline staff profile with id ${args._id} not found` });
    }

    await ctx.db.delete("hotlineProfiles", args._id);
    const inputVersion = await enqueueScheduleRecomputation(ctx);
    return { changed: true, inputVersion, success: true };
  },
});

export const requestHotlineScheduleRecomputation = supervisorMutation({
  returns: z.object({ inputVersion: z.number().int().nonnegative(), success: z.boolean() }),
  handler: async (ctx) => ({
    inputVersion: await enqueueScheduleRecomputation(ctx),
    success: true,
  }),
});
