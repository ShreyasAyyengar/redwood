import { ConvexError } from "convex/values";
import { z } from "zod";
import { components } from "../../_generated/api";
import { adminMutation, adminQuery, internalQuery } from "../../lib/procedures.ts";
import { redwoodUserSchema } from "./schemas.ts";

export const getUsers = adminQuery({
  returns: z.array(redwoodUserSchema),
  handler: async (ctx) => {
    const users = await ctx.db.query("redwoodUsers").withIndex("byEmail").collect();
    return users.map(({ email, role }) => ({ email, role }));
  },
});

export const addUser = adminMutation({
  args: redwoodUserSchema,
  returns: z.boolean(),
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("redwoodUsers")
      .withIndex("byEmail", (query) => query.eq("email", args.email))
      .first();
    if (existingUser) throw new ConvexError({ code: "UNPROCESSABLE_CONTENT", message: "Credentials already exist." });

    await ctx.db.insert("redwoodUsers", args);
    return true;
  },
});

export const removeUser = adminMutation({
  args: redwoodUserSchema.pick({ email: true }),
  returns: z.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("redwoodUsers")
      .withIndex("byEmail", (query) => query.eq("email", args.email))
      .first();
    if (!user) throw new ConvexError({ code: "UNPROCESSABLE_CONTENT", message: "Credentials not found." });

    await ctx.db.delete("redwoodUsers", user._id);
    return true;
  },
});

export const getRole = internalQuery({
  args: z.object({
    email: redwoodUserSchema.shape.email,
  }),
  returns: redwoodUserSchema.shape.role,
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("redwoodUsers")
      .withIndex("byEmail", (query) => query.eq("email", args.email))
      .first();
    if (!user) throw new ConvexError({ code: "UNPROCESSABLE_CONTENT", message: "Credentials not found." });

    return user.role;
  },
});

export const changeRole = adminMutation({
  args: z.object({
    email: redwoodUserSchema.shape.email,
    newRole: redwoodUserSchema.shape.role,
  }),
  returns: z.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("redwoodUsers")
      .withIndex("byEmail", (query) => query.eq("email", args.email))
      .first();
    if (!user) throw new ConvexError({ code: "UNPROCESSABLE_CONTENT", message: "Credentials not found." });

    await ctx.db.patch("redwoodUsers", user._id, { role: args.newRole });
    await ctx.runMutation(components.betterAuth.users.changeRole, { email: args.email, newRole: args.newRole });

    return true;
  },
});

export const hasCredentials = internalQuery({
  args: redwoodUserSchema.pick({ email: true }),
  returns: z.object({
    exists: z.boolean(),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("redwoodUsers")
      .withIndex("byEmail", (query) => query.eq("email", args.email))
      .first();

    return { exists: !!user };
  },
});
