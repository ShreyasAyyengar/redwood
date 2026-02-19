import { httpContract } from "@fullstack-template/contracts";
import { createORPCClient } from "@orpc/client";
import type { ContractRouterClient } from "@orpc/contract";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { headers } from "next/headers";
import { env } from "../env";

const apiPath = env.NEXT_PUBLIC_NODE_ENV === "development" ? "/api" : "";

const link = new OpenAPILink(httpContract, {
  url: `${env.NEXT_PUBLIC_API_URL}${apiPath}`,
  fetch: async (request, init?: RequestInit) => {
    const headersList = await headers();

    return fetch(request, {
      ...init,
      credentials: "include",
      headers: {
        ...(init?.headers ? Object.fromEntries(new Headers(init.headers).entries()) : {}),
        ...Object.fromEntries(headersList.entries()),
      },
    });
  },
});

export const webServerORPC: ContractRouterClient<typeof httpContract> = createORPCClient(link);
