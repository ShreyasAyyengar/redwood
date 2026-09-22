import type { ShiftMatch } from "../model/shift-results";
import { ShiftResultCard } from "./shift-result-card";
export function ShiftResults({ matches: visibleMatches }: { matches: ShiftMatch[] }) {
  return (
    <>
      <h2 className="font-semibold text-lg" role="status">
        {visibleMatches.length} classrooms available
      </h2>
      {visibleMatches.length === 0 && (
        <p className="rounded-lg border p-5 text-muted-foreground">
          No classrooms match these filters. Adjust your filters or try another time frame.
        </p>
      )}
      <div className="space-y-3">
        <div className="hidden grid-cols-[0.5fr_2fr_1.5fr_1.7fr_0.5fr] items-center gap-4 px-5 text-center font-semibold md:grid">
          <span className="rounded-md bg-neutral-800 py-2">Status</span>
          <span className="rounded-md bg-neutral-800 py-2">Classroom</span>
          <span className="rounded-md bg-neutral-800 py-2">Last Serviced</span>
          <span className="rounded-md bg-neutral-800 py-2">Availability</span>
          <span className="rounded-md bg-neutral-800 py-2">Tasks</span>
        </div>
        {visibleMatches.map((match) => (
          <ShiftResultCard key={match.room._id} {...match} />
        ))}
      </div>
    </>
  );
}
