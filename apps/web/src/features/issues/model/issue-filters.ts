import type { api } from "@backend/convex/_generated/api";
import type { FunctionArgs } from "convex/server";

export type IssueDateRange = {
  from: Date | undefined;
  to?: Date;
};

type IssueQueryFilters = NonNullable<FunctionArgs<typeof api.core.issues.service.getIssues>["filters"]>;

export type IssueFeedFilterValue = Omit<IssueQueryFilters, "created" | "resolved"> & {
  created?: IssueDateRange;
  resolved?: IssueDateRange;
};

function serializeDateRange(range: IssueDateRange | undefined) {
  if (!range) return;
  const value = {
    ...(range.from ? { from: range.from.toISOString() } : {}),
    ...(range.to ? { to: range.to.toISOString() } : {}),
  };
  return Object.keys(value).length > 0 ? value : undefined;
}

export function toIssueFeedFilters(value: IssueFeedFilterValue | undefined) {
  if (!value) return;

  const created = serializeDateRange(value.created);
  const resolved = serializeDateRange(value.resolved);
  const filters = {
    ...(value.classroomId ? { classroomId: value.classroomId } : {}),
    ...(value.group ? { group: value.group } : {}),
    ...(value.search ? { search: value.search } : {}),
    ...(created ? { created } : {}),
    ...(resolved ? { resolved } : {}),
    ...(value.urgent !== undefined ? { urgent: value.urgent } : {}),
    ...(value.supervisorNeeded !== undefined ? { supervisorNeeded: value.supervisorNeeded } : {}),
    ...(value.hasSodId !== undefined ? { hasSodId: value.hasSodId } : {}),
    ...(value.hasCruzfixId !== undefined ? { hasCruzfixId: value.hasCruzfixId } : {}),
    ...(value.hasFindings !== undefined ? { hasFindings: value.hasFindings } : {}),
    ...(value.onHold !== undefined ? { onHold: value.onHold } : {}),
  };

  return Object.keys(filters).length > 0 ? filters : undefined;
}
