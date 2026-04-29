import type { classroomSchema } from "@redwood/contracts";
import { cn } from "@redwood/shad-ui/lib/utils";
import { CircleAlert, ThumbsUp, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import {
  convertMinutesToReadable,
  dayAvailability,
  daysAgoNumeric,
  getBlocksForToday,
  getCaliClock,
  getDateTimeDisplay,
} from "../../../util/date-time-utils";
import { urgencyStyle } from "../../../util/style-util";

export default function RoomCard({ room }: { room: z.infer<typeof classroomSchema> }) {
  const router = useRouter();

  const lastServicedDisplay = () => {
    if (!room.lastMaintenance) return <div className="text-center text-foreground text-lg">No Record Yet</div>;

    const date = new Date(room.lastMaintenance.date);
    const daysAgo = daysAgoNumeric(date);
    const { dateDaysAgo } = getDateTimeDisplay(date);

    return (
      <span
        className={cn(
          "p rounded-full px-1 py-0.5 text-xs",
          daysAgo < 14 && urgencyStyle("green"),
          daysAgo >= 14 && daysAgo <= 21 && urgencyStyle("orange"),
          daysAgo > 30 && urgencyStyle("red")
        )}
      >
        <span className="capitalize">{dateDaysAgo}</span>
        {` • ${daysAgo <= 14 ? "Up to Date" : daysAgo <= 21 ? "Pending" : "Overdue"}`}
      </span>
    );
  };

  const roomStatus = () => {
    if (room.roomStatus === "NEEDS URGENT ATTENTION") return <TriangleAlert className="flex h-4 w-4 text-red-500" />;
    if (room.roomStatus === "NEEDS ATTENTION") return <CircleAlert className="flex h-4 w-4 text-yellow-500" />;
    return <ThumbsUp className="flex h-4 w-4" />;
  };

  const availability = () => {
    const { weekdayKey, nowMin } = getCaliClock();
    // biome-ignore lint/style/noNonNullAssertion: this can only be invoked by a classroom displayed with a schedule
    const blocks = getBlocksForToday(room.schedule!, weekdayKey);

    const availability = dayAvailability(blocks, nowMin);

    // TODO toolip "click to show full availability" and then shadcn popover to show it.
    if (availability.kind === "none")
      return (
        <div className="flex flex-col items-end">
          <p className="font-normal text-sm">Next Available:</p>
          <p className="font-semibold text-[#e57373] text-sm">Closed Until Tomorrow</p>
        </div>
      );
    if (availability.kind === "closed")
      return (
        <div className="flex flex-col items-end">
          <p className="font-normal text-sm">Next Available:</p>
          <p className="text-neutral-400 text-sm">
            {convertMinutesToReadable(availability.nextStartMinTime)} - {convertMinutesToReadable(availability.nextEndMinTime)}
          </p>
        </div>
      );
    if (availability.kind === "open")
      return (
        <div className="flex flex-col items-end">
          <p className="font-bold text-[#84bd68] text-sm">Available Now:</p>
          <p className="text-neutral-400 text-sm">
            {convertMinutesToReadable(availability.startMinTime)} - {convertMinutesToReadable(availability.endMinTime)}
          </p>
        </div>
      );

    return null;
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: no keys on mobile view
    <div
      className="mb-5 flex flex-col rounded-lg bg-neutral-900 p-3 shadow-xl/50 ring-1 ring-black/5"
      onClick={() => router.push(`/classroom/${room._id}`)}
    >
      <div className="flex flex-col items-start gap-5">
        <div className="flex items-center gap-2">
          {roomStatus()}

          <div className="flex flex-col">
            <span className="font-bold">{room.displayName}</span>
            {room.groupKey !== "Ungrouped" && <p className="text-neutral-400 text-sm">{room.groupKey}</p>}
          </div>
        </div>
        {/* TODO put horizontal spacer here */}
        <div className="flex w-full justify-between">
          <div className="flex flex-col items-start">
            <span className="text-sm">Last Serviced:</span>
            <span>{lastServicedDisplay()}</span>
          </div>

          <div className="flex items-center gap-2">
            <span>{availability()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
