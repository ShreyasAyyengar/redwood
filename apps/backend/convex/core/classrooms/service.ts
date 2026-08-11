import { ConvexError } from "convex/values";
import { withSystemFields } from "convex-helpers/server/zod";
import { zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import { protectedMutation, protectedQuery } from "../../lib/procedures.ts";
import { classroomSchema, classroomSchemaPayload } from "./schemas.ts";

export const classroomDoc = z.object(withSystemFields("classrooms", classroomSchema.shape));

export const getRoom = protectedQuery({
  args: z.object({
    id: zid("classrooms"),
  }),
  returns: classroomDoc,
  handler: async (ctx, args) => {
    const room = await ctx.db.get("classrooms", args.id);
    if (!room)
      throw new ConvexError({
        code: "NOT_FOUND",
        message: `Room with id ${args.id} not found`,
      });

    return room;
  },
});

export const getAllRooms = protectedQuery({
  returns: z.array(classroomSchemaPayload),
  handler: async (ctx) => {
    const payloads: z.infer<typeof classroomSchemaPayload>[] = [];

    const rooms = await ctx.db
      .query("classrooms")
      .withIndex("byIsActive", (q) => q.eq("isActive", true))
      .collect();

    for (const room of rooms) {
      // TODO: Exclude on-hold issues from appearing here as well
      const activeIssuesCount = (
        await ctx.db
          .query("issues")
          .withIndex("byClassroomIdAndResolution", (q) => q.eq("classroomId", room._id).eq("resolution", undefined))
          .collect()
      ).length;

      const openTasksCount = (
        await ctx.db
          .query("tasks")
          .withIndex("byClassroomIdAndCompletionAndVisibleAt", (q) =>
            q.eq("classroomId", room._id).eq("completion", undefined).lte("task.visibleAt", new Date().toISOString())
          )
          .collect()
      ).length;

      payloads.push({
        ...classroomSchemaPayload.parse(room),
        activeIssuesCount,
        openTasksCount,
      });
    }
    return payloads;
  },
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
