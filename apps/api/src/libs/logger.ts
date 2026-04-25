import pino from "pino";
import { env } from "../env";

const isDev = env.ENV !== "production";

export const logger = pino({
  level: "info",
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM",
        ignore: "pid,hostname",
        messageFormat: "[API] {msg}",
      },
    },
  }),
});
