import type { classroomSchema } from "@redwood/contracts";
import type { Row } from "@tanstack/react-table";
import type { z } from "zod";
import { convertMinutesToReadable, dayAvailability, getBlocksForToday, getCaliClock } from "../../../../util/date-time-utils";

export default function AvailabilityCell({ row }: { row: Row<z.infer<typeof classroomSchema>> }) {
  const { weekdayKey, nowMin } = getCaliClock();
  // biome-ignore lint/style/noNonNullAssertion: this can only be invoked by a classroom displayed with a schedule
  const blocks = getBlocksForToday(row.original.schedule!, weekdayKey);

  const availability = dayAvailability(blocks, nowMin);

  // TODO toolip "click to show full availability" and then shadcn popover to show it.
  return (
    <div className="flex items-center justify-center rounded-2xl border border-black/0 p-1 transition duration-150 hover:cursor-pointer hover:border hover:border-white/50 hover:bg-background-300/20">
      {availability.kind === "open" && (
        <div>
          <p className="text-center font-bold text-[#84bd68] text-lg">Available Now!</p>
          <p className="text-center text-neutral-400 text-sm">
            {convertMinutesToReadable(availability.startMinTime)} - {convertMinutesToReadable(availability.endMinTime)}
          </p>
        </div>
      )}
      {availability.kind === "closed" && (
        <div>
          <p className="text-center font-bold text-lg text-neutral-400">Next Available</p>
          <p className="text-center text-neutral-400 text-sm">
            {convertMinutesToReadable(availability.nextStartMinTime)} - {convertMinutesToReadable(availability.nextEndMinTime)}
          </p>
        </div>
      )}
      {availability.kind === "none" && (
        <div>
          <p className="text-center font-bold text-[#e57373] text-lg">Closed Until Tomorrow</p>
        </div>
      )}
    </div>
  );
}
