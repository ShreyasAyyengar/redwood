import { implement, ORPCError, onError } from "@orpc/server";
import { httpContract } from "@redwood/contracts";
import type { AuthContext } from "./http-context";
import { logger } from "./logger";

export const publicProcedure = implement(httpContract)
  .$context<AuthContext>()
  .use(
    onError((error) => {
      logger.error(
        {
          code: error && typeof error === "object" && "code" in error ? (error as ORPCError<string, unknown>).code : undefined,
          message: error instanceof Error ? error.message : String(error),
          status: error && typeof error === "object" && "status" in error ? (error as ORPCError<string, unknown>).status : undefined,
          cause: error instanceof Error ? error.cause : undefined,
          stack: error instanceof Error ? error.stack : undefined,
        },
        "ORPC Error occurred"
      );

      // If it's a validation error, log the issues
      if (error && typeof error === "object" && "cause" in error) {
        const cause = (error as Error).cause;
        if (cause && typeof cause === "object" && "issues" in cause) {
          logger.error(
            {
              issues: (cause as Record<string, unknown>).issues,
              data: (cause as Record<string, unknown>).data,
            },
            "Validation issues"
          );
        }
      }

      // re-throw the error - oRPC will handle sanitization
      throw error;
    })
  );

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
