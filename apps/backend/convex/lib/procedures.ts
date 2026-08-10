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

const withIdentity = customCtx(async (ctx: AuthCtx) => ({
  identity: await requireIdentity(ctx),
}));

export const internalQuery = zCustomQuery(baseInternalQuery, NoOp);
export const internalMutation = zCustomMutation(baseInternalMutation, NoOp);
export const internalAction = zCustomAction(baseInternalAction, NoOp);

export const publicQuery = zCustomQuery(query, NoOp);
export const publicMutation = zCustomMutation(mutation, NoOp);
export const publicAction = zCustomAction(action, NoOp);

export const protectedQuery = zCustomQuery(query, withIdentity);
export const protectedMutation = zCustomMutation(mutation, withIdentity);
export const protectedAction = zCustomAction(action, withIdentity);
