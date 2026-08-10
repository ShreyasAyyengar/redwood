import { attributeSchema } from "@redwood/contracts";
import { ConvexError } from "convex/values";
import { withSystemFields } from "convex-helpers/server/zod";
import { z } from "zod";
import { protectedMutation, protectedQuery } from "../lib/procedures.ts";
import { classroomDoc } from "./classrooms.ts";

export const attributeDoc = z.object(withSystemFields("attributes", attributeSchema.shape));

export const getAllAttributes = protectedQuery({
  returns: z.array(attributeSchema),
  handler: (ctx, args) => ctx.db.query("attributes").collect(),
});

export const addAttribute = protectedMutation({
  args: attributeDoc.pick({ label: true, color: true }),
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, args) => {
    const existingAttribute = await ctx.db
      .query("attributes")
      .withIndex("byLabel", (q) => q.eq("label", args.label))
      .first();

    if (existingAttribute) {
      throw new ConvexError({
        code: "UNPROCESSABLE_CONTENT",
        data: { message: "Attribute with this label already exists." },
      });
    }

    await ctx.db.insert("attributes", args);
    return { success: true };
  },
});

export const deleteAttribute = protectedMutation({
  args: attributeDoc.pick({ _id: true }),
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, args) => {
    await ctx.db.delete("attributes", args._id);
    return { success: true };
  },
});

export const updateAttribute = protectedMutation({
  args: attributeDoc.pick({ _id: true, label: true, color: true }).partial().required({ _id: true }),
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, args) => {
    await ctx.db.patch("attributes", args._id, args);
    return { success: true };
  },
});

export const applyAttributes = protectedMutation({
  args: z.object({
    updates: z.array(
      z.object({
        classroomId: classroomDoc.shape._id,
        attributes: z.array(attributeDoc.shape._id),
      })
    ),
  }),
  returns: z.object({ success: z.boolean() }),
  handler: async (ctx, args) => {
    for (const { classroomId, attributes } of args.updates) {
      // TODO set classroom attrs
      await ctx.db.patch("classrooms", classroomId, { attributes });
    }
    return { success: true };
  },
});
