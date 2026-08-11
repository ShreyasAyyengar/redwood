import { ConvexError } from "convex/values";
import { withSystemFields, zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import { adminMutation, protectedQuery } from "../../lib/procedures.ts";
import { groupFormSchema, groupSchema } from "./schemas.ts";

export const groupDoc = z.object(withSystemFields("groups", groupSchema.shape));

export const getGroups = protectedQuery({
  returns: z.array(groupDoc),
  handler: (ctx) => ctx.db.query("groups").withIndex("byLabel").collect(),
});

export const addGroup = adminMutation({
  args: groupFormSchema,
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, args) => {
    const existingGroup = await ctx.db
      .query("groups")
      .withIndex("byLabel", (query) => query.eq("label", args.label))
      .first();
    if (existingGroup) throw new ConvexError({ code: "UNPROCESSABLE_CONTENT", message: "Group with this label already exists." });

    await ctx.db.insert("groups", args);
    return { success: true };
  },
});

export const deleteGroup = adminMutation({
  args: z.object({ id: zid("groups") }),
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, args) => {
    const group = await ctx.db.get("groups", args.id);
    if (!group) throw new ConvexError({ code: "NOT_FOUND", message: "Group not found." });

    const classrooms = await ctx.db
      .query("classrooms")
      .withIndex("byGroupKey", (query) => query.eq("groupKey", group.label))
      .collect();

    await ctx.db.delete("groups", args.id);
    await Promise.all(classrooms.map((classroom) => ctx.db.patch("classrooms", classroom._id, { groupKey: "Ungrouped" })));

    return { success: true };
  },
});

export const updateGroup = adminMutation({
  args: groupFormSchema.extend({ _id: zid("groups") }),
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, args) => {
    const group = await ctx.db.get("groups", args._id);
    if (!group) throw new ConvexError({ code: "NOT_FOUND", message: "Group not found." });

    const existingGroup = await ctx.db
      .query("groups")
      .withIndex("byLabel", (query) => query.eq("label", args.label))
      .first();
    if (existingGroup && existingGroup._id !== args._id) {
      throw new ConvexError({ code: "UNPROCESSABLE_CONTENT", message: "Group with this label already exists." });
    }

    if (args.label !== group.label) {
      const classrooms = await ctx.db
        .query("classrooms")
        .withIndex("byGroupKey", (query) => query.eq("groupKey", group.label))
        .collect();
      await Promise.all(classrooms.map((classroom) => ctx.db.patch("classrooms", classroom._id, { groupKey: args.label })));
    }

    await ctx.db.patch("groups", args._id, { label: args.label });
    return { success: true };
  },
});

export const bulkUpdateClassrooms = adminMutation({
  args: z.object({
    updates: z.array(
      z.object({
        classroomId: zid("classrooms"),
        groupKey: z.string(),
      })
    ),
  }),
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, args) => {
    await Promise.all(args.updates.map(({ classroomId, groupKey }) => ctx.db.patch("classrooms", classroomId, { groupKey })));
    return { success: true };
  },
});
