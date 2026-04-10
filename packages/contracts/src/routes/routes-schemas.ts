import { routeRequestSchema, generateRouteOutputSchema } from "./routes-contract";
import { oc } from "@orpc/contract";
import { z } from "zod";

export const routeContract = {
  generateRoute: oc
    .route({
      method: "POST",
    })
    .input(routeRequestSchema)
    .output(generateRouteOutputSchema)
    .errors({
      INTERNAL_SERVER_ERROR: {
        data: z.object({
          message: z.string(),
        }),
      },
    }),
};