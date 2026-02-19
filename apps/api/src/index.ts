import cors from "@elysiajs/cors";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { RPCHandler } from "@orpc/server/bun-ws";
import Elysia, { type Context as ElysiaContext } from "elysia";
import { env } from "./env";
import { authServer } from "./libs/auth-server";
import { createContext } from "./libs/http-context";
import { logger } from "./libs/logger";
import { httpRouter } from "./routers/http-router";
import { webSocketRouter } from "./routers/ws-router";

const port = 3001;

const httpHandler = new OpenAPIHandler(httpRouter);
const wsHandler = new RPCHandler(webSocketRouter);

const isDevelopment = env.ENV === "development";
const allowedOrigins = isDevelopment ? ["http://127.0.0.1:3000", "http://localhost:3003", env.WEBSITE_URL] : [env.WEBSITE_URL];

const apiPrefix = isDevelopment ? "/api" : undefined;
const authRoute = isDevelopment ? "/api/auth*" : "/auth*";
const apiRoute = isDevelopment ? "/api*" : "*";

new Elysia()
  .use(
    cors({
      origin: allowedOrigins,
      methods: ["POST", "PUT", "GET", "DELETE", "PATCH"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .all(authRoute, async ({ request }: { request: Request }) => authServer.handler(request), {
    parse: "none",
  })
  .all(
    apiRoute,
    async ({ request }: { request: Request }) => {
      const elysiaContext: ElysiaContext = { request } as ElysiaContext;
      const authContext = await createContext({ context: elysiaContext });

      const { matched, response } = await httpHandler.handle(request, {
        prefix: apiPrefix,
        context: authContext,
      });

      if (matched) {
        return response;
      }

      return new Response("Not Found", { status: 404 });
    },
    {
      parse: "none",
    }
  )
  .ws(isDevelopment ? "/api/ws" : "/ws", {
    parse(_ws, message) {
      // oRPC client sends JSON, oRPC server must receive raw text to decode back into JSON.
      // this prevents Elysia's native JSON re-writing, so downstream code sees a raw frame again.

      if (message && typeof message === "object" && !(message instanceof ArrayBuffer) && !(message instanceof Uint8Array)) {
        return JSON.stringify(message);
      }
      return message;
    },

    async message(ws, message: string | ArrayBuffer) {
      try {
        let msg: string | Uint8Array;

        if (typeof message === "string") msg = message;
        else msg = new Uint8Array(message);

        // get session from WebSocket upgrade request headers
        const session = await authServer.api.getSession({
          headers: ws.data.headers,
        });

        await wsHandler.message(ws, msg, { context: session ?? { session: null, user: null } });
      } catch (error) {
        logger.error({ error }, "WebSocket message error");
      }
    },

    close(ws) {
      wsHandler.close(ws);
    },
  })
  .listen(
    {
      port,
      hostname: env.HOSTNAME,
    },
    (server) => {
      const protocol = isDevelopment ? "http" : "https";
      logger.info(`API server started | ${protocol}://${server.hostname}:${server.port}`);
    }
  );
