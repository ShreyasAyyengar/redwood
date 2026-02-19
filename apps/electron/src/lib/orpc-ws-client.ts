import type { webSocketContract } from "@fullstack-template/contracts";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/websocket";
import type { ContractRouterClient } from "@orpc/contract";
import { env } from "../env";

const wsPath = env.VITE_NODE_ENV === "development" ? "/api/ws" : "/ws";
const wsProtocol = env.VITE_API_URL.startsWith("https") ? "wss" : "ws";

const wsUrl = `${wsProtocol}://${new URL(env.VITE_API_URL).host}${wsPath}` as const;

const wsLink = new RPCLink({ websocket: new WebSocket(wsUrl) });

export const socketClientORPC: ContractRouterClient<typeof webSocketContract> = createORPCClient(wsLink);
