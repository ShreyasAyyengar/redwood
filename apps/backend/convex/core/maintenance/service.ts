import { paginationOptsValidator } from "convex/server";
import { ConvexError } from "convex/values";
import { convexToZod, withSystemFields, zid } from "convex-helpers/server/zod4";
import { z } from "zod";
import { authComponent } from "../../auth.ts";
import { protectedMutation, protectedQuery } from "../../lib/procedures.ts";
import { maintenanceEntrySchema, maintenanceFormSchema } from "./schemas.ts";

export const maintenanceEntryDoc = z.object(withSystemFields("maintenance", maintenanceEntrySchema.shape));

export const addMaintenanceEntry = protectedMutation({
  args: maintenanceFormSchema.extend({
    classroomId: zid("classrooms"),
  }),
  returns: z.boolean(),
  handler: async (ctx, args) => {
    const classroom = await ctx.db.get("classrooms", args.classroomId);
    if (!classroom) throw new ConvexError({ code: "NOT_FOUND", message: `Classroom with id ${args.classroomId} not found` });
    if (!classroom.isActive) throw new ConvexError({ code: "UNPROCESSABLE_CONTENT", message: `Classroom ${args.classroomId} is not active.` });

    const user = await authComponent.getAuthUser(ctx);
    await ctx.db.patch("classrooms", args.classroomId, {
      lastMaintenance: {
        date: args.date,
        by: user.email,
      },
    });
    await ctx.db.insert("maintenance", {
      ...args,
      completedBy: user.email,
    });

    return true;
  },
});

export const getHistory = protectedQuery({
  args: z.object({
    classroomId: zid("classrooms"),
    paginationOpts: convexToZod(paginationOptsValidator),
  }),
  handler: (ctx, args) =>
    ctx.db
      .query("maintenance")
      .withIndex("byClassroomIdAndDate", (query) => query.eq("classroomId", args.classroomId))
      .order("desc")
      .paginate(args.paginationOpts),
});
