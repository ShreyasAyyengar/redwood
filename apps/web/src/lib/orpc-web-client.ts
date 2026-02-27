import { httpContract } from "@redwood/contracts";
import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { env } from "../env";

const apiPath = env.NEXT_PUBLIC_NODE_ENV === "development" ? "/api" : "";

const link = new OpenAPILink(httpContract, {
  url: `${env.NEXT_PUBLIC_API_URL}${apiPath}`,
  fetch(url, options) {
    return fetch(url, {
      ...options,
      credentials: "include",
    });
  },
});

const client: ContractRouterClient<typeof httpContract> = createORPCClient(link);
export const webClientORPC = createTanstackQueryUtils(client);
