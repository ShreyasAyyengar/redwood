import { internalMutation } from "./lib/procedures.ts";

// TODO DELETE IN PRODUCTION
export const deleteAll = internalMutation({
  handler: async (ctx) => {
    // fetch all calendarEvents, calendarInstances, calendarProviders, googleWebhookChannels and delete them all
    const tables = [] as const;
    for (const table of tables) {
      // biome-ignore lint/performance/noAwaitInLoops: serialise deletes within this mutation.
      const docs = await ctx.db.query(table).collect();
      await Promise.all(docs.map((doc) => ctx.db.delete(doc._id)));
    }
  },
});
