import { eventIterator, oc } from "@orpc/contract";
import { z } from "zod";

export const message = z.object({
  from: z.union([z.literal("expo"), z.literal("electron"), z.literal("web")]),
  content: z.string(),
});

export const webSocketContract = {
  messaging: {
    publishChatMessage: oc.input(message),
    subscribeToChatMessages: oc.output(eventIterator(message)),
    getPastChatMessages: oc.output(z.array(message)),
  },
};
