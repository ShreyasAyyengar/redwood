// renderer/orpc.ts
import { httpContract } from "@fullstack-template/contracts";
import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { env } from "../env.ts";

const apiPath = env.VITE_NODE_ENV === "development" ? "/api" : "";

const link = new OpenAPILink(httpContract, {
  url: `${env.VITE_API_URL}${apiPath}`,
  fetch(url, options) {
    return fetch(url, {
      ...options,
      credentials: "include", // only matters if you truly use cookies
    });
  },
});

const client: ContractRouterClient<typeof httpContract> = createORPCClient(link);
export const electronORPC = createTanstackQueryUtils(client);
