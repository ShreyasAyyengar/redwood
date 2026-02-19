import { publicProcedure } from "../libs/orpc-procedures";

let counter = 0;
export const counterRouter = {
  incrementCounter: publicProcedure.counter.incrementCounter.handler(() => ++counter),
  getCounter: publicProcedure.counter.getCounter.handler(() => {
    console.log("endpoint called");
    return counter;
  }),
  decrementCounter: publicProcedure.counter.decrementCounter.handler(() => --counter),
  resetCounter: publicProcedure.counter.resetCounter.handler(() => {
    counter = 0;
    return counter;
  }),
};
