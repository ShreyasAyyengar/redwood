import type { message } from "@fullstack-template/contracts";
import { MemoryPublisher } from "@orpc/experimental-publisher/memory";
import type { z } from "zod";
import { webSocketProcedure } from "../libs/orpc-procedures";

export const messages: z.infer<typeof message>[] = [];

type DemoMessageEvents = Record<string, z.infer<typeof message>>;
export const demoMessagePublisher = new MemoryPublisher<DemoMessageEvents>({
  resumeRetentionSeconds: 60 * 5, // Keep events for 5 minutes to support reconnection
});

export const messagingRouter = {
  publishChatMessage: webSocketProcedure.messaging.publishChatMessage.handler(({ input }) => {
    messages.push(input);
    demoMessagePublisher.publish("chat", input);
  }),

  subscribeToChatMessages: webSocketProcedure.messaging.subscribeToChatMessages.handler(async function* () {
    const iterator = demoMessagePublisher.subscribe("chat");

    for await (const payload of iterator) {
      yield payload;
    }
  }),

  getPastChatMessages: webSocketProcedure.messaging.getPastChatMessages.handler(() => messages),
};
