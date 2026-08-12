import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server.ts";

export const changeRole = mutation({
  args: v.object({
    email: v.string(),
    newRole: v.string(),
  }),
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("user")
      .withIndex("email", (query) => query.eq("email", args.email))
      .first();
    if (!user) throw new ConvexError({ code: "UNPROCESSABLE_CONTENT", message: "User not found." });

    await ctx.db.patch("user", user._id, { role: args.newRole });
    return { success: true };
  },
});
