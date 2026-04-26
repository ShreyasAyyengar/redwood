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

const maxTrackedRouteKeys = 100;
const otherRouteCounterKey = "__other__";
// biome-ignore lint/style/noMagicNumbers: Standard binary megabyte conversion.
const bytesPerMegabyte = 1024 * 1024;
const megabytePrecision = 100;
const routeCounters = new Map<string, number>([[otherRouteCounterKey, 0]]);

function incrementRouteCounter(request: Request) {
  const { pathname } = new URL(request.url);
  const key = `${request.method} ${pathname}`;

  if (routeCounters.has(key)) {
    routeCounters.set(key, (routeCounters.get(key) ?? 0) + 1);
    return;
  }

  if (routeCounters.size - 1 < maxTrackedRouteKeys) {
    routeCounters.set(key, 1);
    return;
  }

  routeCounters.set(otherRouteCounterKey, (routeCounters.get(otherRouteCounterKey) ?? 0) + 1);
}

function bytesToMegabytes(bytes: number) {
  return Math.round((bytes / bytesPerMegabyte) * megabytePrecision) / megabytePrecision;
}

function memoryMetric(bytes: number) {
  return {
    bytes,
    mb: bytesToMegabytes(bytes),
  };
}

new Elysia()
  .onRequest(({ request }) => {
    incrementRouteCounter(request);
  })
  .use(
    cors({
      origin: allowedOrigins,
      methods: ["POST", "PUT", "GET", "DELETE", "PATCH"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  )
  .get("/debug/memory", async ({ request }: { request: Request }) => {
    const session = await authServer.api.getSession({
      headers: request.headers,
    });

    if (!session?.session || !session.user) {
      return new Response(JSON.stringify({ message: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (session.user.role !== "admin") {
      return new Response(JSON.stringify({ message: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const usage = process.memoryUsage();
    return {
      memory: {
        rss: memoryMetric(usage.rss),
        heapUsed: memoryMetric(usage.heapUsed),
        heapTotal: memoryMetric(usage.heapTotal),
        external: memoryMetric(usage.external),
        arrayBuffers: memoryMetric(usage.arrayBuffers),
      },
      uptimeSeconds: Math.round(process.uptime()),
      routeCounters: Object.fromEntries(routeCounters),
    };
  })
  .get("/debug/gc", () => {
    // biome-ignore lint/correctness/noUndeclaredVariables: Bun is provided by the API runtime.
    Bun.gc(true); // Forces a full Garbage Collection cycle
    return { message: "GC triggered" };
  })
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
