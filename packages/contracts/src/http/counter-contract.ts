import { oc } from "@orpc/contract";
import { z } from "zod";

export const counterContract = {
  getCounter: oc
    .route({
      method: "GET",
    })
    .output(z.number()),
  incrementCounter: oc
    .route({
      method: "GET",
    })
    .output(z.number()),
  decrementCounter: oc
    .route({
      method: "GET" ,
    })
    .output(z.number()),
  resetCounter: oc
    .route({
      method: "GET",
    })
    .output(z.number()),
};
