import type { Context as ElysiaContext } from "elysia";
import { authServer } from "./auth-server";

export type CreateContextOptions = {
  context: ElysiaContext;
};

export async function createContext({ context }: CreateContextOptions) {
  const session = await authServer.api.getSession({
    headers: context.request.headers,
  });

  return session ?? { session: null, user: null };
}

export type AuthContext = Awaited<ReturnType<typeof createContext>>;
