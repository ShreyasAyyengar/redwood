import cors from "@elysiajs/cors";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import Elysia, { type Context as ElysiaContext } from "elysia";
import { env } from "./env";
import { authServer } from "./libs/auth-server";
import { createContext } from "./libs/http-context";
import { logger } from "./libs/logger";
import { httpRouter } from "./routers/http-router";

const port = 3001;

const httpHandler = new OpenAPIHandler(httpRouter);

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

setInterval(() => {
  Bun.gc(true);
}, 600_000); // 10 minutes
