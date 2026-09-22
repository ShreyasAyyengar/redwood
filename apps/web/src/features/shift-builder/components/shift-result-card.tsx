import { CircleAlert, OctagonPause, ThumbsUp, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { ClassroomSummary } from "#/features/classrooms/model/classroom-types.ts";
import { convertMinutesToReadable, daysAgoNumeric, getDateTimeDisplay } from "#/util/date-time-utils.ts";
import { MINUTES_PER_DAY } from "../model/availability";
import { getServiceStatus, type ShiftMatch } from "../model/shift-results";

export function ShiftResultCard({ room, openings }: ShiftMatch) {
  return (
    <Link
      href={`/classroom/${room._id}`}
      className="grid items-center gap-4 rounded-2xl border bg-neutral-900/50 p-5 transition-colors hover:bg-neutral-800/60 focus-visible:outline-2 focus-visible:outline-ring md:grid-cols-[0.5fr_2fr_1.5fr_1.7fr_0.5fr]"
    >
      <div className="flex md:justify-center" title={room.roomStatus}>
        <span className="sr-only">{room.roomStatus}</span>
        {room.roomStatus === "GOOD" ? (
          <ThumbsUp aria-hidden="true" />
        ) : room.roomStatus === "ON HOLD" ? (
          <OctagonPause className="text-zinc-500" aria-hidden="true" />
        ) : room.roomStatus === "NEEDS URGENT ATTENTION" ? (
          <TriangleAlert className="text-red-500" aria-hidden="true" />
        ) : (
          <CircleAlert className="text-yellow-500" aria-hidden="true" />
        )}
      </div>
      <div>
        <h3 className="font-bold">{room.displayName}</h3>
        {room.groupKey !== "Ungrouped" && <p className="mt-1 text-neutral-400 text-xs">{room.groupKey}</p>}
      </div>
      <div className="text-sm md:text-center">
        <p className="mb-1 text-muted-foreground text-xs md:hidden">Last serviced</p>
        <MaintenanceDisplay room={room} />
      </div>
      <div className="space-y-1 md:text-center">
        <p className="font-semibold text-[#84bd68] text-sm">Open during your shift</p>
        {openings.map((block) => (
          <p key={`${block.startTimeMin}-${block.endTimeMin}`} className="text-neutral-400 text-xs">
            {formatShiftTime(block.startTimeMin)} – {formatShiftTime(block.endTimeMin)}
          </p>
        ))}
      </div>
      <div className="md:text-center">
        <span className="text-muted-foreground text-xs md:hidden">Open tasks: </span>
        <span className="font-bold text-3xl">{room.openTasksCount}</span>
      </div>
    </Link>
  );
}

function formatShiftTime(minutes: number) {
  return `${convertMinutesToReadable(minutes % MINUTES_PER_DAY)}${minutes >= MINUTES_PER_DAY ? " (next day)" : ""}`;
}

function MaintenanceDisplay({ room }: { room: ClassroomSummary }) {
  if (!room.lastMaintenance) return <span>No Record Yet</span>;
  const date = new Date(room.lastMaintenance.date);
  const days = daysAgoNumeric(date);
  const recentDays = 14;
  const overdueDays = 30;
  const status = getServiceStatus(room);
  const color =
    days < recentDays
      ? "bg-emerald-500/15 text-emerald-400"
      : days <= overdueDays
        ? "bg-orange-500/15 text-orange-400"
        : "bg-red-500/15 text-red-400";
  return (
    <>
      <span className={`inline-block rounded-full px-2 py-1 capitalize ${color}`}>
        {getDateTimeDisplay(date).dateDaysAgo} • {status}
      </span>
      <p className="mt-1 text-xs">
        {date.toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric" })} •{" "}
        {room.lastMaintenance.by.split("@")[0]}
      </p>
    </>
  );
}
