import { implement, ORPCError } from "@orpc/server";
import { httpContract } from "@redwood/contracts";
import type { AuthContext } from "./http-context";

export const publicProcedure = implement(httpContract).$context<AuthContext>();

export const protectedProcedure = publicProcedure.use(({ context, next }) => {
  if (!context.session) {
    throw new ORPCError("UNAUTHORIZED", {
      message: "Authentication required",
      cause: "No session",
    });
  }

  return next({
    context,
  });
});

export const adminProcedure = protectedProcedure.use(({ context, next }) => {
  if (!context.user.admin) {
    throw new ORPCError("FORBIDDEN", {
      message: "Admin access required",
      cause: "Not admin",
    });
  }

  return next({
    context,
  });
});
