import { Car, CircleAlert, ClipboardList, Wrench } from "lucide-react";
import { convertMinutesToReadable } from "#/util/date-time-utils.ts";
import { MINUTES_PER_DAY } from "../model/availability";
import type { ShiftRoute } from "../model/route-planner";
import { ShiftResultCard } from "./shift-result-card";

function time(minutes: number) {
  return `${convertMinutesToReadable(minutes % MINUTES_PER_DAY)}${minutes >= MINUTES_PER_DAY ? " (next day)" : ""}`;
}

export function ShiftRouteResults({ route, shiftStart, shiftEnd }: { route: ShiftRoute; shiftStart: number; shiftEnd: number }) {
  const finish = route.stops.at(-1)?.end ?? shiftStart;
  return (
    <section className="space-y-4" aria-label="Planned shift route">
      <div>
        <h2 className="font-semibold text-lg">{route.exact ? "Optimized route" : "Suggested route"}</h2>
        <p className="text-muted-foreground text-sm" role="status">
          {route.stops.length} rooms · {route.workCount} work items · {shiftEnd - finish} minutes left
        </p>
        <p className="mt-2 text-muted-foreground text-xs">
          Driving times are currently set to 0 minutes. Task and issue durations are not included yet.
          {!route.exact && " This suggested schedule may not be the best possible route."}
        </p>
      </div>
      {route.stops.length === 0 && <p>No visits fit these filters, room openings, and maintenance time before shift end.</p>}
      <ol>
        {route.stops.map((stop, index) => (
          <li key={stop.room._id}>
            {index > 0 && (
              <div className="flex flex-col items-center py-2 text-muted-foreground text-sm">
                <div className="h-4 border-l border-dashed" aria-hidden="true" />
                <p className="flex items-center gap-2 rounded-full border bg-muted/30 px-4 py-2">
                  <Car className="size-4" aria-hidden="true" />
                  {stop.travel} min driving · {route.stops[index - 1]?.room.displayName} → {stop.room.displayName}
                </p>
                <div className="h-4 border-l border-dashed" aria-hidden="true" />
              </div>
            )}
            <div className="space-y-3 rounded-2xl border bg-neutral-900/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-sm">
                <p className="font-semibold">
                  Stop {index + 1} · {time(stop.start)} – {time(stop.end)}
                </p>
                <p className="text-muted-foreground">
                  {stop.start > stop.arrival && `${stop.start - stop.arrival} min wait · `}
                  {stop.remaining} min left after visit
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 px-2 text-sm">
                <span className="font-medium">Work on:</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-primary">
                  <Wrench className="size-3.5" aria-hidden="true" />
                  Maintenance
                </span>
                {stop.room.openTasksCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-blue-400">
                    <ClipboardList className="size-3.5" aria-hidden="true" />
                    {stop.room.openTasksCount} {stop.room.openTasksCount === 1 ? "task" : "tasks"}
                  </span>
                )}
                {stop.room.activeIssuesCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-orange-400">
                    <CircleAlert className="size-3.5" aria-hidden="true" />
                    {stop.room.activeIssuesCount} {stop.room.activeIssuesCount === 1 ? "issue" : "issues"}
                  </span>
                )}
              </div>
              <ShiftResultCard room={stop.room} openings={stop.openings} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
