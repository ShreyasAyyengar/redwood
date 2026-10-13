import { withSystemFields } from "convex-helpers/server/zod4";
import { z } from "zod";
import { protectedQuery, supervisorMutation } from "../../../lib/procedures.ts";
import { hotlineMediaCodeFields, hotlineSettingsSchema } from "./schemas.ts";

const hotlineSettingsDoc = z.object(withSystemFields("hotlineSettings", hotlineSettingsSchema.shape));

export const getHotlineSettings = protectedQuery({
  args: z.object({}),
  returns: hotlineSettingsDoc.nullable(),
  handler: (ctx) =>
    ctx.db
      .query("hotlineSettings")
      .withIndex("byKey", (query) => query.eq("key", "current"))
      .unique(),
});

export const updateHotlineMediaCode = supervisorMutation({
  args: hotlineMediaCodeFields,
  returns: z.null(),
  handler: async (ctx, args) => {
    const current = await ctx.db
      .query("hotlineSettings")
      .withIndex("byKey", (query) => query.eq("key", "current"))
      .unique();
    const settings = {
      ...args,
      key: "current" as const,
      updatedAt: Date.now(),
      updatedBy: ctx.identity.email,
    };

    if (current) await ctx.db.patch("hotlineSettings", current._id, settings);
    else await ctx.db.insert("hotlineSettings", settings);

    return null;
  },
});
