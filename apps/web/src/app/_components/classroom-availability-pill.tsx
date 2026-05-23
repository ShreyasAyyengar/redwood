import type { classroomSchemaPayload } from "@redwood/contracts";
import { cn } from "@redwood/shad-ui/lib/utils";
import { Clock3 } from "lucide-react";
import type { z } from "zod";
import { formatMinutesRange, getScheduleAvailability, SHORT_WEEKDAY_LABEL_BY_KEY } from "../../util/date-time-utils";

// TODO remove this pill from tasks/issues that are already completed.
type Classroom = z.infer<typeof classroomSchemaPayload>;
type AvailabilityDisplay = {
  label: string;
  range?: string;
  title: string;
  tone: "available" | "next" | "unavailable";
};

const toneStyles: Record<AvailabilityDisplay["tone"], string> = {
  available: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100 shadow-emerald-950/20",
  next: "border-cyan-500/25 bg-cyan-500/10 text-cyan-100 shadow-cyan-950/20",
  unavailable: "border-zinc-800/80 bg-zinc-950/50 text-zinc-400",
};

function getAvailabilityDisplay(room: Classroom): AvailabilityDisplay | undefined {
  if (!room.schedule) return;

  const availability = getScheduleAvailability(room.schedule);

  if (availability.kind === "open") {
    const range = formatMinutesRange(availability.startMinTime, availability.endMinTime);

    return {
      label: "Available Now!",
      range,
      title: `${room.displayName} is available now, ${range}.`,
      tone: "available",
    };
  }

  if (availability.kind === "next") {
    const timeRange = formatMinutesRange(availability.nextStartMinTime, availability.nextEndMinTime);
    const range =
      availability.dayOffset === 0
        ? timeRange
        : `${availability.dayOffset === 1 ? "Tomorrow" : SHORT_WEEKDAY_LABEL_BY_KEY[availability.weekdayKey]} ${timeRange}`;
    const titleRange = availability.dayOffset === 0 ? `today, ${range}` : range;

    return {
      label: "Next Available",
      range,
      title: `${room.displayName} is next available ${titleRange}.`,
      tone: "next",
    };
  }

  return {
    label: "No availability posted",
    title: `${room.displayName} does not have upcoming availability on the current schedule.`,
    tone: "unavailable",
  };
}

export function ClassroomAvailabilityPill({ room, className }: { room: Classroom; className?: string }) {
  const availability = getAvailabilityDisplay(room);

  if (!availability) return null;

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 align-middle font-medium text-[11px] leading-none shadow-sm",
        toneStyles[availability.tone],
        className
      )}
      title={availability.title}
    >
      <Clock3 className="size-3 shrink-0 opacity-80" />
      <span className="shrink-0">{availability.label}</span>
      {availability.range && <span className="min-w-0 truncate text-current/70">({availability.range})</span>}
    </span>
  );
}
