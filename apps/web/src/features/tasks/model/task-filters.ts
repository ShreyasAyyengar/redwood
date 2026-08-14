import { api } from "@backend/convex/_generated/api";
import type { FunctionArgs } from "convex/server";

export type TaskDateRange = {
  from: Date | undefined;
  to?: Date;
};

type TaskQueryFilters = NonNullable<FunctionArgs<typeof api.core.tasks.service.getTasks>["filters"]>;

export type TaskFeedFilterValue = Omit<TaskQueryFilters, "completed" | "created"> & {
  completed?: TaskDateRange;
  created?: TaskDateRange;
};

function serializeDateRange(range: TaskDateRange | undefined) {
  if (!range) return undefined;
  return {
    ...(range.from ? { from: range.from.toISOString() } : {}),
    ...(range.to ? { to: range.to.toISOString() } : {}),
  };
}

export function serializeTaskFeedFilters(filters: TaskFeedFilterValue | undefined): TaskQueryFilters | undefined {
  if (!filters) return undefined;
  const { completed, created, ...rest } = filters;
  return {
    ...rest,
    ...(created ? { created: serializeDateRange(created) } : {}),
    ...(completed ? { completed: serializeDateRange(completed) } : {}),
  };
}
