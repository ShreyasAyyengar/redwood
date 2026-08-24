import { ConvexError } from "convex/values";
import { withSystemFields, zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import { protectedMutation, protectedQuery, supervisorMutation } from "../../lib/procedures.ts";
import { hotlineCategory, hotlineEntry } from "./schemas.ts";

export const hotlineEntryDoc = z.object(withSystemFields("hotline", hotlineEntry.shape));
export const hotlineCategoryDoc = z.object(withSystemFields("hotlineCategories", hotlineCategory.shape));

export const getHotlineEntries = protectedQuery({
  returns: z.array(hotlineEntryDoc),
  handler: (ctx) => ctx.db.query("hotline").order("desc").collect(),
});

export const getHotlineEntry = protectedQuery({
  args: z.object({ _id: zid("hotline") }),
  returns: hotlineEntryDoc,
  handler: async (ctx, args) => {
    const entry = await ctx.db.get("hotline", args._id);
    if (!entry) throw new ConvexError({ code: "NOT_FOUND", message: `Hotline entry with id ${args._id} not found` });

    return entry;
  },
});

export const createHotlineEntry = protectedMutation({
  args: hotlineEntry,
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, args) => {
    const category = await ctx.db.get("hotlineCategories", args.hotlineCategory);
    if (!category) {
      throw new ConvexError({ code: "NOT_FOUND", message: `Hotline category with id ${args.hotlineCategory} not found` });
    }

    await ctx.db.insert("hotline", args);
    return { success: true };
  },
});

export const updateHotlineEntry = protectedMutation({
  args: hotlineEntry.partial().extend({ _id: zid("hotline") }),
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, args) => {
    const entry = await ctx.db.get("hotline", args._id);
    if (!entry) throw new ConvexError({ code: "NOT_FOUND", message: `Hotline entry with id ${args._id} not found` });

    if (args.hotlineCategory) {
      const category = await ctx.db.get("hotlineCategories", args.hotlineCategory);
      if (!category) {
        throw new ConvexError({ code: "NOT_FOUND", message: `Hotline category with id ${args.hotlineCategory} not found` });
      }
    }

    const { _id, ...updates } = args;
    await ctx.db.patch("hotline", _id, updates);
    return { success: true };
  },
});

export const deleteHotlineEntry = protectedMutation({
  args: hotlineEntryDoc.pick({ _id: true }),
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, args) => {
    const entry = await ctx.db.get("hotline", args._id);
    if (!entry) throw new ConvexError({ code: "NOT_FOUND", message: `Hotline entry with id ${args._id} not found` });

    await ctx.db.delete("hotline", args._id);
    return { success: true };
  },
});

export const getHotlineCategories = protectedQuery({
  returns: z.array(hotlineCategoryDoc),
  handler: (ctx) => ctx.db.query("hotlineCategories").withIndex("byLabel").collect(),
});

export const getHotlineCategory = protectedQuery({
  args: z.object({ _id: zid("hotlineCategories") }),
  returns: hotlineCategoryDoc,
  handler: async (ctx, args) => {
    const category = await ctx.db.get("hotlineCategories", args._id);
    if (!category) throw new ConvexError({ code: "NOT_FOUND", message: `Hotline category with id ${args._id} not found` });

    return category;
  },
});

export const createHotlineCategory = supervisorMutation({
  args: hotlineCategory,
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, args) => {
    const existingCategory = await ctx.db
      .query("hotlineCategories")
      .withIndex("byLabel", (query) => query.eq("label", args.label))
      .first();
    if (existingCategory) {
      throw new ConvexError({ code: "UNPROCESSABLE_CONTENT", message: "Hotline category with this label already exists." });
    }

    await ctx.db.insert("hotlineCategories", args);
    return { success: true };
  },
});

export const updateHotlineCategory = supervisorMutation({
  args: hotlineCategory.extend({ _id: zid("hotlineCategories") }),
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, args) => {
    const category = await ctx.db.get("hotlineCategories", args._id);
    if (!category) throw new ConvexError({ code: "NOT_FOUND", message: `Hotline category with id ${args._id} not found` });

    const existingCategory = await ctx.db
      .query("hotlineCategories")
      .withIndex("byLabel", (query) => query.eq("label", args.label))
      .first();
    if (existingCategory && existingCategory._id !== args._id) {
      throw new ConvexError({ code: "UNPROCESSABLE_CONTENT", message: "Hotline category with this label already exists." });
    }

    await ctx.db.patch("hotlineCategories", args._id, { label: args.label });
    return { success: true };
  },
});

export const deleteHotlineCategory = supervisorMutation({
  args: hotlineCategoryDoc.pick({ _id: true }),
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, args) => {
    const category = await ctx.db.get("hotlineCategories", args._id);
    if (!category) throw new ConvexError({ code: "NOT_FOUND", message: `Hotline category with id ${args._id} not found` });

    const entryUsingCategory = await ctx.db
      .query("hotline")
      .filter((query) => query.eq(query.field("hotlineCategory"), args._id))
      .first();
    if (entryUsingCategory) {
      throw new ConvexError({ code: "UNPROCESSABLE_CONTENT", message: "Cannot delete a hotline category that is in use." });
    }

    await ctx.db.delete("hotlineCategories", args._id);
    return { success: true };
  },
});
