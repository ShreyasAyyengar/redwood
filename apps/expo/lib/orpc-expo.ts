// renderer/orpc.ts
import { httpContract } from "@fullstack-template/contracts";
import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { env } from "@/env";

const apiPath = env.EXPO_PUBLIC_NODE_ENV === "development" ? "/api" : "";

export const link = new OpenAPILink(httpContract, {
  url: `${env.EXPO_PUBLIC_API_URL}${apiPath}`,
  async fetch(request, init) {
    const { fetch } = await import("expo/fetch");

    return await fetch(request.url, {
      body: await request.blob(),
      headers: request.headers,
      method: request.method,
      signal: request.signal,
      ...init,
    });
  },
});

const client: ContractRouterClient<typeof httpContract> = createORPCClient(link);
export const expoORPC = createTanstackQueryUtils(client);
