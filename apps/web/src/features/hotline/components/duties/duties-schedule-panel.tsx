"use client";

import { api } from "@backend/convex/_generated/api";
import type { Doc } from "@backend/convex/_generated/dataModel";
import { Button } from "@redwood/shad-ui/components/button";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useMutation } from "convex/react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Clock3,
  Eye,
  EyeOff,
  LoaderCircle,
  MousePointer2,
  RotateCw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const DAY_LABELS: Record<Day, string> = {
  friday: "Friday",
  monday: "Monday",
  thursday: "Thursday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
};
const SHORT_DAY_LABELS: Record<Day, string> = {
  friday: "Fri",
  monday: "Mon",
  thursday: "Thu",
  tuesday: "Tue",
  wednesday: "Wed",
};
const MINUTES_PER_HOUR = 60;
const HOURS_PER_HALF_DAY = 12;
const START_HOUR = 8;
const END_HOUR = 20;
const NOON_HOUR = 12;
const AFTERNOON_MARKER_HOUR = 16;
const MILLISECONDS_PER_SECOND = 1000;
const PERCENT = 100;
const HALF_SLOT = 0.5;
const MINIMUM_SLOTS_FOR_TIME_LABEL = 4;
const START_MINUTES = START_HOUR * MINUTES_PER_HOUR;
const END_MINUTES = END_HOUR * MINUTES_PER_HOUR;
const SLOT_MINUTES = 30;
const SLOTS = Array.from({ length: (END_MINUTES - START_MINUTES) / SLOT_MINUTES }, (_, index) => START_MINUTES + index * SLOT_MINUTES);
const PROFILE_COLORS = ["bg-cyan-400", "bg-fuchsia-400", "bg-lime-400", "bg-orange-400", "bg-indigo-400", "bg-rose-400"];

type Day = (typeof DAYS)[number];
type HotlineProfile = Doc<"hotlineProfiles">;
type HotlineScheduleState = Doc<"hotlineScheduleState">;
type TimeRange = { end: string; start: string };
type DutyStatus = "AVAILABLE" | "LAST_AVAILABLE" | "SOLO" | "BREAK" | "OFF_DUTY" | "OUT_OF_OFFICE" | "UNSCHEDULED";
type InspectionPoint = { day: Day; slotIndex: number };

const STATUS_META: Record<DutyStatus, { badge: string; block: string; cell: string; label: string; shortLabel: string }> = {
  AVAILABLE: {
    badge: "border-sky-400/25 bg-sky-400/10 text-sky-300",
    block: "border-sky-300/30 bg-sky-400 text-sky-950",
    cell: "bg-sky-400",
    label: "Available",
    shortLabel: "Available",
  },
  BREAK: {
    badge: "border-zinc-500/25 bg-zinc-500/10 text-zinc-400",
    block: "border-zinc-500/40 bg-zinc-700 text-zinc-100",
    cell: "bg-zinc-600",
    label: "Break / blocked",
    shortLabel: "Break",
  },
  LAST_AVAILABLE: {
    badge: "border-amber-300/25 bg-amber-300/10 text-amber-200",
    block: "border-amber-200/30 bg-amber-300 text-amber-950",
    cell: "bg-amber-300",
    label: "Focused · last available",
    shortLabel: "Focused",
  },
  OFF_DUTY: {
    badge: "border-emerald-400/15 bg-emerald-400/5 text-emerald-300/70",
    block: "border-zinc-700 bg-zinc-900 text-zinc-400",
    cell: "bg-emerald-950/80",
    label: "Working · no duty",
    shortLabel: "No duty",
  },
  OUT_OF_OFFICE: {
    badge: "border-zinc-700 bg-zinc-900 text-zinc-600",
    block: "border-zinc-900 bg-zinc-950 text-zinc-700",
    cell: "bg-zinc-950",
    label: "Out of office",
    shortLabel: "OOO",
  },
  SOLO: {
    badge: "border-violet-400/25 bg-violet-400/10 text-violet-300",
    block: "border-violet-300/30 bg-violet-400 text-violet-950",
    cell: "bg-violet-400",
    label: "Solo coverage",
    shortLabel: "Solo",
  },
  UNSCHEDULED: {
    badge: "border-dashed border-zinc-600 bg-zinc-900/40 text-zinc-500",
    block: "border-dashed border-zinc-600 bg-zinc-800 text-zinc-300",
    cell: "bg-zinc-800/70",
    label: "Awaiting schedule",
    shortLabel: "Pending",
  },
};

function parseTime(time: string) {
  const [hour = "0", minute = "0"] = time.split(":");
  return Number(hour) * MINUTES_PER_HOUR + Number(minute);
}

function formatTime(minutes: number) {
  const hour = Math.floor(minutes / MINUTES_PER_HOUR);
  const minute = minutes % MINUTES_PER_HOUR;
  const displayHour = hour % HOURS_PER_HALF_DAY || HOURS_PER_HALF_DAY;
  return `${displayHour}${minute === 0 ? "" : `:${String(minute).padStart(2, "0")}`} ${hour < HOURS_PER_HALF_DAY ? "AM" : "PM"}`;
}

function isInRanges(start: number, ranges: TimeRange[]) {
  return ranges.some((range) => start >= parseTime(range.start) && start < parseTime(range.end));
}

function getDutyStatus(profile: HotlineProfile, day: Day, start: number): DutyStatus {
  if (!profile.enabled) return "OUT_OF_OFFICE";
  const availability = profile.availabilityProfile[day];
  if (!availability || start < parseTime(availability.shift.start) || start >= parseTime(availability.shift.end)) {
    return "OUT_OF_OFFICE";
  }
  if (isInRanges(start, availability.blockages)) return "BREAK";

  const generated = profile.generatedWeeklySchedule?.schedule[day];
  if (!profile.generatedWeeklySchedule) return "UNSCHEDULED";
  if (!generated) return "OUT_OF_OFFICE";
  if (isInRanges(start, generated.solo)) return "SOLO";
  if (isInRanges(start, generated.available)) return "AVAILABLE";
  if (isInRanges(start, generated.lastAvailable)) return "LAST_AVAILABLE";
  if (isInRanges(start, generated.breaks)) return "BREAK";
  return "OFF_DUTY";
}

function getTodayDay(date: Date): Day | undefined {
  return DAYS[date.getDay() - 1];
}

function getCurrentSlot(date: Date) {
  const minutes = date.getHours() * MINUTES_PER_HOUR + date.getMinutes();
  return Math.max(0, Math.min(SLOTS.length - 1, Math.floor((minutes - START_MINUTES) / SLOT_MINUTES)));
}

function getStatusRuns(profile: HotlineProfile, day: Day) {
  const runs: Array<{ end: number; start: number; status: DutyStatus }> = [];
  for (const [slotIndex, start] of SLOTS.entries()) {
    const status = getDutyStatus(profile, day, start);
    const previous = runs.at(-1);
    if (previous?.status === status) previous.end = slotIndex + 1;
    else runs.push({ end: slotIndex + 1, start: slotIndex, status });
  }
  return runs;
}

function DutyStatusBadge({ status }: { status: DutyStatus }) {
  const meta = STATUS_META[status];
  return <span className={cn("rounded-full border px-2 py-0.5 font-medium text-[10px]", meta.badge)}>{meta.shortLabel}</span>;
}

function ScheduleStatus({ state }: { state: HotlineScheduleState | null | undefined }) {
  if (state?.status === "PENDING" || state?.status === "SOLVING") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/25 bg-sky-500/10 px-2.5 py-1 font-medium text-sky-300 text-xs">
        <LoaderCircle className="size-3 animate-spin" />
        {state.status === "PENDING" ? "Queued" : "Balancing duties"}
      </span>
    );
  }
  if (state?.status === "INFEASIBLE" || state?.status === "FAILED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1 font-medium text-red-300 text-xs">
        <AlertTriangle className="size-3" /> Needs attention
      </span>
    );
  }
  if (state?.status === "READY") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-300 text-xs">
        <Check className="size-3" /> Up to date
      </span>
    );
  }
  return null;
}

function Timeline({
  compact = false,
  day,
  onInspect,
  profile,
  selectedSlot,
}: {
  compact?: boolean;
  day: Day;
  onInspect?: (point: InspectionPoint) => void;
  profile: HotlineProfile;
  selectedSlot?: number;
}) {
  return (
    <div className={cn("flex h-5 overflow-hidden rounded-md border border-zinc-800 bg-zinc-950", compact ? "min-w-0" : "min-w-72")}>
      {SLOTS.map((start, slotIndex) => {
        const status = getDutyStatus(profile, day, start);
        return (
          <button
            type="button"
            key={start}
            aria-label={`${profile.displayName}, ${DAY_LABELS[day]}, ${formatTime(start)}: ${STATUS_META[status].label}`}
            className={cn(
              "min-w-1 flex-1 border-zinc-950/50 border-r last:border-r-0",
              STATUS_META[status].cell,
              selectedSlot === slotIndex && "relative z-10 ring-2 ring-white/80 ring-inset"
            )}
            onPointerDown={(event) => {
              event.preventDefault();
              onInspect?.({ day, slotIndex });
            }}
            onPointerEnter={() => onInspect?.({ day, slotIndex })}
            title={`${formatTime(start)} · ${STATUS_META[status].label}`}
          />
        );
      })}
    </div>
  );
}

function TodayOverview({
  currentProfile,
  now,
  profiles,
}: {
  currentProfile: HotlineProfile | null | undefined;
  now: Date;
  profiles: HotlineProfile[];
}) {
  const today = getTodayDay(now);
  const slotIndex = getCurrentSlot(now);
  const withinCoverage =
    now.getHours() * MINUTES_PER_HOUR + now.getMinutes() >= START_MINUTES && now.getHours() * MINUTES_PER_HOUR + now.getMinutes() < END_MINUTES;
  const currentStatus =
    currentProfile && today && withinCoverage ? getDutyStatus(currentProfile, today, SLOTS[slotIndex] ?? START_MINUTES) : "OUT_OF_OFFICE";
  const currentStatusLabel = today ? (withinCoverage ? STATUS_META[currentStatus].label : "Outside coverage hours") : "No weekday duties today";
  const runs =
    currentProfile && today ? getStatusRuns(currentProfile, today).filter((run) => !["OUT_OF_OFFICE", "OFF_DUTY"].includes(run.status)) : [];

  return (
    <div className="grid gap-4 xl:grid-cols-[17rem_minmax(0,1fr)]">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-black/15 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <span className="font-medium text-xs text-zinc-500 uppercase tracking-[0.16em]">Your day</span>
          <span className="text-[11px] text-zinc-600 tabular-nums">{formatTime(now.getHours() * MINUTES_PER_HOUR + now.getMinutes())}</span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className={cn("flex size-11 items-center justify-center rounded-xl border", STATUS_META[currentStatus].badge)}>
            <ShieldCheck className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-zinc-100">{currentProfile?.displayName ?? "No profile"}</p>
            <p className="mt-0.5 text-sm text-zinc-400">{currentStatusLabel}</p>
          </div>
        </div>
        <div className="mt-4 border-zinc-800 border-t pt-3">
          <p className="font-medium text-[10px] text-zinc-600 uppercase tracking-wide">Today’s hotline blocks</p>
          <div className="mt-2 space-y-1.5">
            {runs.length > 0 ? (
              runs.map((run) => (
                <div key={`${run.start}-${run.status}`} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-zinc-500">{STATUS_META[run.status].shortLabel}</span>
                  <span className="text-zinc-300 tabular-nums">
                    {formatTime(START_MINUTES + run.start * SLOT_MINUTES)}–{formatTime(START_MINUTES + run.end * SLOT_MINUTES)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-600">No hotline blocks scheduled.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/45 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-zinc-200">{today ? `${DAY_LABELS[today]} coverage` : "Today’s coverage"}</p>
            <p className="mt-0.5 text-xs text-zinc-600">The full team, from 8 AM to 8 PM.</p>
          </div>
          <CalendarDays className="size-4 text-zinc-600" />
        </div>
        {today ? (
          <div className="mt-4 space-y-2.5">
            {profiles.map((profile) => (
              <div key={profile._id} className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3">
                <span className="truncate text-xs text-zinc-400">{profile.displayName}</span>
                <Timeline day={today} profile={profile} selectedSlot={withinCoverage ? slotIndex : undefined} />
              </div>
            ))}
            <div className="ml-[7.25rem] flex justify-between text-[9px] text-zinc-700 tabular-nums">
              <span>8 AM</span>
              <span>2 PM</span>
              <span>8 PM</span>
            </div>
          </div>
        ) : (
          <div className="mt-8 flex items-center justify-center rounded-xl border border-zinc-800 border-dashed py-8 text-sm text-zinc-600">
            Weekday coverage resumes Monday.
          </div>
        )}
      </div>
    </div>
  );
}

function ScheduleInspector({
  hiddenProfileIds,
  point,
  profiles,
}: {
  hiddenProfileIds: Set<string>;
  point: InspectionPoint;
  profiles: HotlineProfile[];
}) {
  const start = SLOTS[point.slotIndex] ?? START_MINUTES;
  return (
    <aside className="self-start rounded-2xl border border-sky-500/20 bg-zinc-950/80 p-4 shadow-black/20 shadow-xl xl:sticky xl:top-0">
      <div className="flex items-start justify-between gap-3 border-zinc-800 border-b pb-3">
        <div>
          <p className="font-medium text-[10px] text-sky-400 uppercase tracking-[0.16em]">Time inspector</p>
          <p className="mt-1 font-semibold text-zinc-100">
            {SHORT_DAY_LABELS[point.day]} · {formatTime(start)}
          </p>
          <p className="mt-0.5 text-[11px] text-zinc-600">through {formatTime(start + SLOT_MINUTES)}</p>
        </div>
        <MousePointer2 className="size-4 text-sky-500" />
      </div>
      <div className="mt-3 space-y-2.5">
        {profiles.map((profile, index) => {
          const status = getDutyStatus(profile, point.day, start);
          const hidden = hiddenProfileIds.has(profile._id);
          return (
            <div key={profile._id} className={cn("flex items-center justify-between gap-2", hidden && "opacity-45")}>
              <div className="flex min-w-0 items-center gap-2">
                <span className={cn("size-2 shrink-0 rounded-full", PROFILE_COLORS[index % PROFILE_COLORS.length])} />
                <span className="truncate text-xs text-zinc-300">{profile.displayName}</span>
                {hidden && <EyeOff className="size-3 shrink-0 text-zinc-700" />}
              </div>
              <DutyStatusBadge status={status} />
            </div>
          );
        })}
      </div>
      <p className="mt-4 border-zinc-800 border-t pt-3 text-[10px] text-zinc-700 leading-4">
        Hover or drag across the selected day to scrub through the schedule.
      </p>
    </aside>
  );
}

const TIME_MARKERS = [START_MINUTES, NOON_HOUR * MINUTES_PER_HOUR, AFTERNOON_MARKER_HOUR * MINUTES_PER_HOUR, END_MINUTES];

function ScheduleLane({
  day,
  onInspect,
  profile,
  selectedSlot,
}: {
  day: Day;
  onInspect: (point: InspectionPoint) => void;
  profile: HotlineProfile;
  selectedSlot: number;
}) {
  const runs = getStatusRuns(profile, day);
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] border-zinc-800 border-b last:border-b-0">
      <div className="flex min-w-0 items-center gap-2 border-zinc-800 border-r bg-zinc-950/50 px-3 py-4">
        <UserRound className="size-4 shrink-0 text-zinc-600" />
        <span className="truncate font-medium text-sm text-zinc-300">{profile.displayName}</span>
      </div>
      <div className="h-[4.5rem] overflow-hidden bg-zinc-950/25 px-6 py-1.5">
        <div className="relative h-full">
          <div className="pointer-events-none absolute inset-0 grid grid-cols-24">
            {SLOTS.map((start, slotIndex) => (
              <span
                key={start}
                className={cn(
                  "border-zinc-800/55 border-r last:border-r-0",
                  slotIndex % 2 !== 0 && "border-r-zinc-700/70",
                  selectedSlot === slotIndex && "border-x border-x-sky-200/60 bg-sky-200/8"
                )}
              />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-0 grid grid-cols-24 grid-rows-1 gap-px">
            {runs.map((run) => {
              const slotCount = run.end - run.start;
              return (
                <div
                  key={`${run.start}-${run.status}`}
                  className={cn(
                    "min-w-0 overflow-hidden rounded-md border px-2 py-1.5 shadow-black/10 shadow-sm",
                    STATUS_META[run.status].block
                  )}
                  style={{ gridColumn: `${run.start + 1} / ${run.end + 1}`, gridRow: 1 }}
                >
                  {slotCount >= 2 && <p className="truncate font-semibold text-[11px] leading-4">{STATUS_META[run.status].shortLabel}</p>}
                  {slotCount >= MINIMUM_SLOTS_FOR_TIME_LABEL && (
                    <p className="truncate text-[9px] leading-3 opacity-75">
                      {formatTime(START_MINUTES + run.start * SLOT_MINUTES)}–{formatTime(START_MINUTES + run.end * SLOT_MINUTES)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <div className="absolute inset-0 z-10 grid grid-cols-24">
            {SLOTS.map((start, slotIndex) => (
              <button
                type="button"
                key={start}
                aria-label={`${profile.displayName}, ${DAY_LABELS[day]}, ${formatTime(start)}: ${STATUS_META[getDutyStatus(profile, day, start)].label}`}
                onPointerDown={(event) => {
                  event.preventDefault();
                  onInspect({ day, slotIndex });
                }}
                onPointerEnter={() => onInspect({ day, slotIndex })}
                title={`${profile.displayName} · ${formatTime(start)} · ${STATUS_META[getDutyStatus(profile, day, start)].label}`}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200/80 focus-visible:ring-inset"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectedDaySchedule({
  day,
  onInspect,
  profiles,
  selectedSlot,
}: {
  day: Day;
  onInspect: (point: InspectionPoint) => void;
  profiles: HotlineProfile[];
  selectedSlot: number;
}) {
  const selectedStart = SLOTS[selectedSlot] ?? START_MINUTES;
  const markerPosition = ((selectedSlot + HALF_SLOT) / SLOTS.length) * PERCENT;
  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/40">
      <div className="min-w-[32rem]">
        <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] border-zinc-800 border-b bg-zinc-950/65">
          <div className="flex items-end border-zinc-800 border-r px-3 py-3 font-medium text-[10px] text-zinc-600 uppercase tracking-wide">
            Employee
          </div>
          <div className="relative h-14">
            <div className="absolute inset-y-0 right-6 left-6">
              {TIME_MARKERS.map((time, index) => {
                const position = ((time - START_MINUTES) / (END_MINUTES - START_MINUTES)) * PERCENT;
                return (
                  <span
                    key={time}
                    className="absolute bottom-3 text-[10px] text-zinc-500 tabular-nums"
                    style={{
                      left: `${position}%`,
                      transform: `translateX(${index === 0 ? "0" : index === TIME_MARKERS.length - 1 ? "-100%" : "-50%"})`,
                    }}
                  >
                    {formatTime(time)}
                  </span>
                );
              })}
              <div className="absolute top-1 -translate-x-1/2" style={{ left: `${markerPosition}%` }}>
                <span className="whitespace-nowrap rounded-md border border-sky-300/25 bg-sky-400 px-1.5 py-0.5 font-semibold text-[9px] text-sky-950 shadow-md shadow-sky-950/30">
                  {formatTime(selectedStart)}
                </span>
                <span className="mx-auto block h-4 w-px bg-sky-300/80" />
              </div>
            </div>
          </div>
        </div>
        {profiles.length > 0 ? (
          profiles.map((profile) => (
            <ScheduleLane key={profile._id} day={day} profile={profile} selectedSlot={selectedSlot} onInspect={onInspect} />
          ))
        ) : (
          <div className="flex items-center justify-center py-14 text-sm text-zinc-600">
            Everyone is hidden. Select a name above to restore them.
          </div>
        )}
      </div>
    </div>
  );
}

function WeeklySchedule({ profiles }: { profiles: HotlineProfile[] }) {
  const initialDate = useMemo(() => new Date(), []);
  const initialDay = getTodayDay(initialDate) ?? "monday";
  const [point, setPoint] = useState<InspectionPoint>({ day: initialDay, slotIndex: getCurrentSlot(initialDate) });
  const [hiddenProfileIds, setHiddenProfileIds] = useState<Set<string>>(() => new Set());

  const inspect = (nextPoint: InspectionPoint) => setPoint(nextPoint);
  const toggleProfile = (profileId: string) => {
    setHiddenProfileIds((current) => {
      const next = new Set(current);
      if (next.has(profileId)) next.delete(profileId);
      else next.add(profileId);
      return next;
    });
  };
  const visibleProfiles = profiles.filter((profile) => !hiddenProfileIds.has(profile._id));

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-medium text-sky-400 text-xs uppercase tracking-[0.18em]">Weekly calendar</p>
          <h4 className="mt-1 font-semibold text-lg text-zinc-100">Team duties</h4>
          <p className="mt-1 text-sm text-zinc-500">Choose a day, hide people, then scrub the timeline for details.</p>
        </div>
        <div className="flex max-w-full flex-wrap gap-2">
          {profiles.map((profile, index) => {
            const hidden = hiddenProfileIds.has(profile._id);
            return (
              <Button
                type="button"
                key={profile._id}
                variant="outline"
                size="sm"
                onClick={() => toggleProfile(profile._id)}
                className={cn("h-7 gap-1.5 border-zinc-800 bg-zinc-950/40 px-2.5 text-xs", hidden ? "text-zinc-600" : "text-zinc-300")}
              >
                {hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                <span className={cn("size-1.5 rounded-full", PROFILE_COLORS[index % PROFILE_COLORS.length])} />
                {profile.displayName}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto pb-1">
        <div className="grid min-w-[620px] grid-cols-5 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/45">
          {DAYS.map((day) => (
            <button
              type="button"
              key={day}
              onClick={() => setPoint((current) => ({ ...current, day }))}
              className={cn(
                "border-zinc-800 border-r px-3 py-3 text-center font-semibold text-sm transition-colors last:border-r-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-inset",
                point.day === day ? "bg-sky-400 text-sky-950" : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
              )}
            >
              {SHORT_DAY_LABELS[day]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid gap-4 xl:grid-cols-[minmax(0,1fr)_15rem]">
        <SelectedDaySchedule day={point.day} profiles={visibleProfiles} selectedSlot={point.slotIndex} onInspect={inspect} />
        <ScheduleInspector hiddenProfileIds={hiddenProfileIds} point={point} profiles={profiles} />
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 rounded-xl border border-zinc-800/80 bg-zinc-950/30 px-4 py-3 text-xs text-zinc-500">
        {(Object.keys(STATUS_META) as DutyStatus[]).map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-sm", STATUS_META[status].cell)} />
            {STATUS_META[status].label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DutiesSchedulePanel({
  canRecomputeSchedule,
  currentProfile,
  profiles,
  state,
}: {
  canRecomputeSchedule: boolean;
  currentProfile: HotlineProfile | null | undefined;
  profiles: HotlineProfile[] | undefined;
  state: HotlineScheduleState | null | undefined;
}) {
  const requestRecomputation = useMutation(api.core.hotline.schedule.service.requestHotlineScheduleRecomputation);
  const [now, setNow] = useState(() => new Date());
  const [isRequestingRecomputation, setIsRequestingRecomputation] = useState(false);
  const [recomputationError, setRecomputationError] = useState<string>();

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), MINUTES_PER_HOUR * MILLISECONDS_PER_SECOND);
    return () => window.clearInterval(interval);
  }, []);

  const sortedProfiles = useMemo(
    () => [...(profiles ?? [])].sort((left, right) => left.displayName.localeCompare(right.displayName)),
    [profiles]
  );
  const failed = state?.status === "INFEASIBLE" || state?.status === "FAILED";
  const isRecomputing = isRequestingRecomputation || state?.status === "PENDING" || state?.status === "SOLVING";

  const handleRecompute = async () => {
    setIsRequestingRecomputation(true);
    setRecomputationError(undefined);
    try {
      await requestRecomputation({});
    } catch (error) {
      setRecomputationError(error instanceof Error ? error.message : "The schedule could not be queued.");
    } finally {
      setIsRequestingRecomputation(false);
    }
  };

  return (
    <section className="min-h-[32rem] min-w-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.07),transparent_44%)] p-5 lg:p-7">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium text-sky-400 text-xs uppercase tracking-[0.18em]">Hotline command center</p>
            <h3 className="mt-1 font-semibold text-xl text-zinc-100">Coverage at a glance</h3>
            <p className="mt-1 max-w-2xl text-sm text-zinc-500">See what is happening now, scan today, or scrub through the whole week.</p>
          </div>
          <div className="flex items-center gap-2">
            <ScheduleStatus state={state} />
            {canRecomputeSchedule && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isRecomputing || sortedProfiles.length === 0}
                onClick={handleRecompute}
                title="Generate again from saved hotline profiles. Unsaved availability edits are not submitted."
                className="border-zinc-700 bg-zinc-950/60 text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100"
              >
                <RotateCw className={cn(isRecomputing && "animate-spin")} />
                {isRecomputing ? "Generating…" : "Re-run schedule"}
              </Button>
            )}
          </div>
        </div>

        {recomputationError && <p className="mt-3 text-red-300 text-xs">{recomputationError}</p>}

        {failed && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-300" />
            <div>
              <p className="font-medium text-red-200">
                {state.status === "INFEASIBLE" ? "The current availability cannot cover every hotline slot." : "The scheduler could not finish."}
              </p>
              {state.error && <p className="mt-1 text-red-300/70 text-xs">{state.error}</p>}
              {sortedProfiles.some((profile) => profile.generatedWeeklySchedule) && (
                <p className="mt-1 text-xs text-zinc-500">The last valid generated schedule remains visible.</p>
              )}
            </div>
          </div>
        )}

        {profiles === undefined ? (
          <div className="mt-8 flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/35 py-20 text-zinc-500">
            <LoaderCircle className="mr-2 size-4 animate-spin" /> Loading duties…
          </div>
        ) : sortedProfiles.length > 0 ? (
          <>
            <div className="mt-5">
              <TodayOverview currentProfile={currentProfile} now={now} profiles={sortedProfiles} />
            </div>
            <WeeklySchedule profiles={sortedProfiles} />
          </>
        ) : (
          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/35 p-8 text-center shadow-black/10 shadow-xl">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-300">
              <Sparkles className="size-5" />
            </div>
            <h3 className="mt-4 font-semibold text-zinc-200">Weekly duties will appear here</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 leading-6">
              Add the first hotline profile to begin generating team coverage.
            </p>
          </div>
        )}

        {state?.status === "READY" && state.completedAt && (
          <div className="mt-4 flex items-center justify-end gap-1.5 text-[10px] text-zinc-700">
            <Clock3 className="size-3" /> Generated {new Date(state.completedAt).toLocaleString()}
          </div>
        )}
      </div>
    </section>
  );
}
