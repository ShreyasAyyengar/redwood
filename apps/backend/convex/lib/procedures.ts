/** biome-ignore-all lint/style/noRestrictedImports: only allowed here to defined custom procedures */

import { ConvexError } from "convex/values";
import { customCtx, NoOp } from "convex-helpers/server/customFunctions";
import { zCustomAction, zCustomMutation, zCustomQuery } from "convex-helpers/server/zod4";

import {
  type ActionCtx,
  action,
  internalAction as baseInternalAction,
  internalMutation as baseInternalMutation,
  internalQuery as baseInternalQuery,
  type MutationCtx,
  mutation,
  type QueryCtx,
  query,
} from "../_generated/server";
import { authComponent } from "../auth.ts";

type AuthCtx = QueryCtx | MutationCtx | ActionCtx;

async function requireIdentity(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }

  return identity;
}

async function requireAdmin(ctx: AuthCtx) {
  const identity = await authComponent.getAuthUser(ctx);

  if (identity?.role !== "admin") {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Administrator access required",
    });
  }

  return identity;
}

async function requireSupervisor(ctx: AuthCtx) {
  const identity = await authComponent.getAuthUser(ctx);

  if (identity?.role !== "supervisor" && identity?.role !== "admin") {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "Supervisor access required",
    });
  }

  return identity;
}

const withIdentity = customCtx(async (ctx: AuthCtx) => ({
  identity: await requireIdentity(ctx),
}));

const withAdminIdentity = customCtx(async (ctx: AuthCtx) => ({
  identity: await requireAdmin(ctx),
}));

const withSupervisorIdentity = customCtx(async (ctx: AuthCtx) => ({
  identity: await requireSupervisor(ctx),
}));

export const internalQuery = zCustomQuery(baseInternalQuery, NoOp);
export const internalMutation = zCustomMutation(baseInternalMutation, NoOp);
export const internalAction = zCustomAction(baseInternalAction, NoOp);

export const protectedQuery = zCustomQuery(query, withIdentity);
export const protectedMutation = zCustomMutation(mutation, withIdentity);
export const protectedAction = zCustomAction(action, withIdentity);

export const supervisorQuery = zCustomQuery(query, withSupervisorIdentity);
export const supervisorMutation = zCustomMutation(mutation, withSupervisorIdentity);
export const supervisorAction = zCustomAction(action, withSupervisorIdentity);

export const adminQuery = zCustomQuery(query, withAdminIdentity);
export const adminMutation = zCustomMutation(mutation, withAdminIdentity);
export const adminAction = zCustomAction(action, withAdminIdentity);
