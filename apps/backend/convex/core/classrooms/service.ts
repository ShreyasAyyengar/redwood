import { ConvexError } from "convex/values";
import { withSystemFields } from "convex-helpers/server/zod";
import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import { protectedMutation, protectedQuery } from "../../lib/procedures.ts";
import { classroomSchema } from "./schemas.ts";

export const classroomDoc = z.object(withSystemFields("classrooms", classroomSchema.shape));
export const classroomPayloadDoc = classroomDoc.extend({
  openTasksCount: z.number(),
  activeIssuesCount: z.number(),
  roomStatus: z.enum(["GOOD", "ON HOLD", "NEEDS ATTENTION", "NEEDS URGENT ATTENTION"]),
});

export const getRoom = protectedQuery({
  args: z.object({
    id: zid("classrooms"),
  }),
  returns: classroomPayloadDoc,
  handler: async (ctx, args) => {
    const room = await ctx.db.get("classrooms", args.id);
    if (!room)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: `Room with id ${args.id} not found`,
      });

    const unresolvedIssues = await ctx.db
      .query("issues")
      .withIndex("byClassroomIdAndResolution", (q) => q.eq("classroomId", room._id).eq("resolution", undefined))
      .collect();
    const activeIssues = unresolvedIssues.filter((issue) => !issue.issue.onHold);
    const roomStatus: z.infer<typeof classroomPayloadDoc>["roomStatus"] = activeIssues.some((issue) => issue.issue.urgent)
      ? "NEEDS URGENT ATTENTION"
      : activeIssues.length > 0
        ? "NEEDS ATTENTION"
        : unresolvedIssues.length > 0
          ? "ON HOLD"
          : "GOOD";
    const openTasksCount = (
      await ctx.db
        .query("tasks")
        .withIndex("byClassroomIdAndCompletionAndVisibleAt", (q) =>
          q.eq("classroomId", room._id).eq("completion", undefined).lte("task.visibleAt", new Date().toISOString())
        )
        .collect()
    ).length;

    return {
      ...room,
      activeIssuesCount: activeIssues.length,
      openTasksCount,
      roomStatus,
    };
  },
});

export const getAllRooms = protectedQuery({
  returns: z.array(classroomPayloadDoc),
  handler: async (ctx) => {
    const payloads: z.infer<typeof classroomPayloadDoc>[] = [];

    const rooms = await ctx.db
      .query("classrooms")
      .withIndex("byIsActive", (q) => q.eq("isActive", true))
      .collect();

    for (const room of rooms) {
      const unresolvedIssues = await ctx.db
        .query("issues")
        .withIndex("byClassroomIdAndResolution", (q) => q.eq("classroomId", room._id).eq("resolution", undefined))
        .collect();
      const activeIssues = unresolvedIssues.filter((issue) => !issue.issue.onHold);
      const activeIssuesCount = activeIssues.length;
      const roomStatus: z.infer<typeof classroomPayloadDoc>["roomStatus"] = activeIssues.some((issue) => issue.issue.urgent)
        ? "NEEDS URGENT ATTENTION"
        : activeIssuesCount > 0
          ? "NEEDS ATTENTION"
          : unresolvedIssues.length > 0
            ? "ON HOLD"
            : "GOOD";

      const openTasksCount = (
        await ctx.db
          .query("tasks")
          .withIndex("byClassroomIdAndCompletionAndVisibleAt", (q) =>
            q.eq("classroomId", room._id).eq("completion", undefined).lte("task.visibleAt", new Date().toISOString())
          )
          .collect()
      ).length;

      payloads.push({
        ...room,
        activeIssuesCount,
        openTasksCount,
        roomStatus,
      });
    }
    return payloads;
  },
});

// Lookup for consumers that must display archived classrooms too, such as
// historical issue feeds.
export const getClassroomLookup = protectedQuery({
  returns: z.array(classroomDoc),
  handler: (ctx) => ctx.db.query("classrooms").collect(),
});

export const setAttributes = protectedMutation({
  args: z.object({
    classroomId: zid("classrooms"),
    attributeIds: z.array(zid("attributes")),
  }),
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, { classroomId, attributeIds }) => {
    await ctx.db.patch("classrooms", classroomId, {
      attributes: [...new Set(attributeIds)],
    });

    return { success: true };
  },
});

export const updateRoomMetadata = protectedMutation({
  args: z.object({
    classroomId: zid("classrooms"),
    metadata: classroomSchema.pick({ groupKey: true, attributes: true, captioning: true }),
  }),
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, { classroomId, metadata }) => {
    const patch: Partial<z.infer<typeof classroomSchema>> = {};
    if (metadata.groupKey !== undefined) patch.groupKey = metadata.groupKey;
    if (metadata.attributes !== undefined) patch.attributes = metadata.attributes;
    if (metadata.captioning !== undefined) patch.captioning = metadata.captioning;

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch("classrooms", classroomId, patch);
    }

    return { success: true };
  },
});
