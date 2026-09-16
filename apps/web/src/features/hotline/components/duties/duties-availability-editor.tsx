"use client";

import { api } from "@backend/convex/_generated/api";
import type { Doc } from "@backend/convex/_generated/dataModel";
import { Button } from "@redwood/shad-ui/components/button";
import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { Input } from "@redwood/shad-ui/components/input";
import { Label } from "@redwood/shad-ui/components/label";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import {
  AlertTriangle,
  CalendarClock,
  Check,
  Clock3,
  Coffee,
  LoaderCircle,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const DAY_LABELS: Record<Day, string> = {
  friday: "Fri",
  monday: "Mon",
  thursday: "Thu",
  tuesday: "Tue",
  wednesday: "Wed",
};
const MINUTES_PER_HOUR = 60;
const HOURS_PER_HALF_DAY = 12;
const START_HOUR = 7;
const START_MINUTE_OFFSET = 30;
const END_HOUR = 20;
const START_MINUTES = START_HOUR * MINUTES_PER_HOUR + START_MINUTE_OFFSET;
const END_MINUTES = END_HOUR * MINUTES_PER_HOUR;
const SLOT_MINUTES = 30;
const SLOT_COUNT = (END_MINUTES - START_MINUTES) / SLOT_MINUTES;
const TIME_SLOTS = Array.from({ length: SLOT_COUNT }, (_, index) => START_MINUTES + index * SLOT_MINUTES);

type Day = (typeof DAYS)[number];
type EditorMode = "shift" | "breaks";
type DayAvailability = { breaks: boolean[]; shift: boolean[] };
type WeeklyAvailability = Record<Day, DayAvailability>;
type DragState = { mode: EditorMode; value: boolean } | undefined;
type AvailabilityProfile = Doc<"hotlineProfiles">["availabilityProfile"];
type TimeRange = { end: string; start: string };
type HotlineProfile = Doc<"hotlineProfiles">;
type HotlineScheduleState = Doc<"hotlineScheduleState">;

function createEmptyWeek(): WeeklyAvailability {
  return Object.fromEntries(
    DAYS.map((day) => [
      day,
      {
        breaks: Array.from({ length: SLOT_COUNT }, () => false),
        shift: Array.from({ length: SLOT_COUNT }, () => false),
      },
    ])
  ) as WeeklyAvailability;
}

function formatTime(minutes: number) {
  const hour = Math.floor(minutes / MINUTES_PER_HOUR);
  const minute = minutes % MINUTES_PER_HOUR;
  const displayHour = hour % HOURS_PER_HALF_DAY || HOURS_PER_HALF_DAY;
  return `${displayHour}${minute === 0 ? "" : `:${String(minute).padStart(2, "0")}`} ${hour < HOURS_PER_HALF_DAY ? "AM" : "PM"}`;
}

function getSelectedHours(week: WeeklyAvailability, key: keyof DayAvailability) {
  return DAYS.reduce((total, day) => total + week[day][key].filter(Boolean).length, 0) * (SLOT_MINUTES / 60);
}

function parseTime(time: string) {
  const [hour = "0", minute = "0"] = time.split(":");
  return Number(hour) * MINUTES_PER_HOUR + Number(minute);
}

function serializeTime(minutes: number) {
  const hour = Math.floor(minutes / MINUTES_PER_HOUR);
  const minute = minutes % MINUTES_PER_HOUR;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function paintRange(cells: boolean[], range: TimeRange) {
  const startIndex = Math.max(0, Math.floor((parseTime(range.start) - START_MINUTES) / SLOT_MINUTES));
  const endIndex = Math.min(SLOT_COUNT, Math.ceil((parseTime(range.end) - START_MINUTES) / SLOT_MINUTES));
  for (let index = startIndex; index < endIndex; index += 1) cells[index] = true;
}

function createWeekFromProfile(profile: AvailabilityProfile): WeeklyAvailability {
  const week = createEmptyWeek();
  for (const day of DAYS) {
    const dayProfile = profile[day];
    if (!dayProfile) continue;
    paintRange(week[day].shift, dayProfile.shift);
    for (const blockage of dayProfile.blockages) paintRange(week[day].breaks, blockage);
  }
  return week;
}

function serializeRanges(cells: boolean[]): TimeRange[] {
  const ranges: TimeRange[] = [];
  let rangeStart: number | undefined;

  for (let index = 0; index <= cells.length; index += 1) {
    if (cells[index] && rangeStart === undefined) rangeStart = index;
    if (!cells[index] && rangeStart !== undefined) {
      ranges.push({
        start: serializeTime(START_MINUTES + rangeStart * SLOT_MINUTES),
        end: serializeTime(START_MINUTES + index * SLOT_MINUTES),
      });
      rangeStart = undefined;
    }
  }

  return ranges;
}

function serializeWeek(week: WeeklyAvailability): AvailabilityProfile {
  return Object.fromEntries(
    DAYS.map((day) => {
      const shiftRanges = serializeRanges(week[day].shift);
      if (shiftRanges.length === 0) return [day, null];
      if (shiftRanges.length > 1) throw new Error(`${DAY_LABELS[day]} needs one continuous working shift.`);

      return [
        day,
        {
          shift: shiftRanges[0],
          blockages: serializeRanges(week[day].breaks),
        },
      ];
    })
  ) as AvailabilityProfile;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Your availability could not be saved. Please try again.";
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: the editor keeps its related pointer and save state together.
export function DutiesAvailabilityEditor({ defaultName }: { defaultName: string }) {
  const profile = useQuery(api.core.hotline.schedule.service.getCurrentHotlineStaffProfile, {});
  const scheduleState = useQuery(api.core.hotline.schedule.service.getHotlineScheduleState, {});
  const saveProfile = useMutation(api.core.hotline.schedule.service.saveCurrentHotlineStaffProfile);
  const [employeeName, setEmployeeName] = useState(defaultName);
  const [isReserve, setIsReserve] = useState(false);
  const [mode, setMode] = useState<EditorMode>("shift");
  const [week, setWeek] = useState(createEmptyWeek);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [isSaved, setIsSaved] = useState(false);
  const [didQueueRecompute, setDidQueueRecompute] = useState(false);
  const dragState = useRef<DragState>(undefined);
  const hasLoadedProfile = useRef(false);

  useEffect(() => {
    if (profile === undefined || hasLoadedProfile.current) return;
    hasLoadedProfile.current = true;

    if (profile) {
      setEmployeeName(profile.displayName);
      setIsReserve(profile.schedulingClass === "RESERVE");
      setWeek(createWeekFromProfile(profile.availabilityProfile));
    }
  }, [profile]);

  useEffect(() => {
    const stopDragging = () => {
      dragState.current = undefined;
    };

    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);
    return () => {
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, []);

  const paintCell = useCallback((day: Day, slotIndex: number, editorMode: EditorMode, value: boolean) => {
    setWeek((current) => {
      const currentDay = current[day];
      if (editorMode === "breaks" && !currentDay.shift[slotIndex]) return current;

      const shift = [...currentDay.shift];
      const breaks = [...currentDay.breaks];

      if (editorMode === "shift") {
        shift[slotIndex] = value;
        if (!value) breaks[slotIndex] = false;
      } else {
        breaks[slotIndex] = value;
      }

      return { ...current, [day]: { breaks, shift } };
    });
    setIsDirty(true);
    setIsSaved(false);
    setDidQueueRecompute(false);
    setSaveError(undefined);
  }, []);

  const startPainting = (day: Day, slotIndex: number) => {
    const cell = week[day];
    if (mode === "breaks" && !cell.shift[slotIndex]) return;

    const value = mode === "shift" ? !cell.shift[slotIndex] : !cell.breaks[slotIndex];
    dragState.current = { mode, value };
    paintCell(day, slotIndex, mode, value);
  };

  const continuePainting = (day: Day, slotIndex: number) => {
    const drag = dragState.current;
    if (!drag) return;
    paintCell(day, slotIndex, drag.mode, drag.value);
  };

  const shiftHours = useMemo(() => getSelectedHours(week, "shift"), [week]);
  const breakHours = useMemo(() => getSelectedHours(week, "breaks"), [week]);

  const clearAvailability = () => {
    setWeek(createEmptyWeek());
    setMode("shift");
    setIsDirty(true);
    setIsSaved(false);
    setDidQueueRecompute(false);
    setSaveError(undefined);
  };

  const updateEmployeeName = (name: string) => {
    setEmployeeName(name);
    setIsDirty(true);
    setIsSaved(false);
    setDidQueueRecompute(false);
    setSaveError(undefined);
  };

  const updateReserveStatus = (reserve: boolean) => {
    setIsReserve(reserve);
    setIsDirty(true);
    setIsSaved(false);
    setDidQueueRecompute(false);
    setSaveError(undefined);
  };

  const handleSave = async () => {
    const displayName = employeeName.trim();
    if (!displayName) {
      setSaveError("Enter your name before saving.");
      return;
    }

    setIsSaving(true);
    setSaveError(undefined);
    try {
      const result = await saveProfile({
        displayName,
        availabilityProfile: serializeWeek(week),
        schedulingClass: isReserve ? "RESERVE" : "STANDARD",
      });
      setEmployeeName(displayName);
      setIsDirty(false);
      setIsSaved(true);
      setDidQueueRecompute(result.changed);
    } catch (error) {
      setSaveError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <section className="flex min-h-0 w-full flex-col border-zinc-800 border-b bg-zinc-950/20 lg:w-1/3 lg:min-w-96 lg:border-r lg:border-b-0">
        <div className="shrink-0 border-zinc-800 border-b px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-zinc-100">Your availability</h3>
              <p className="mt-1 text-sm text-zinc-500">Paint your usual week in two quick steps.</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={clearAvailability}
              disabled={shiftHours === 0}
              aria-label="Clear availability"
              title="Clear availability"
              className="text-zinc-500 hover:text-zinc-200"
            >
              <RotateCcw />
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            <Label htmlFor="hotline-employee-name" className="text-xs text-zinc-400">
              Name
            </Label>
            <div className="relative">
              <UserRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
              <Input
                id="hotline-employee-name"
                value={employeeName}
                onChange={(event) => updateEmployeeName(event.target.value)}
                placeholder="Your name"
                className="border-zinc-700 bg-zinc-900/80 pl-9 text-zinc-100"
              />
            </div>
          </div>

          <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900/35 px-3 py-2.5">
            <Checkbox
              id="hotline-reserve"
              checked={isReserve}
              onCheckedChange={(checked) => updateReserveStatus(checked === true)}
              className="mt-0.5 border-zinc-600 data-[state=checked]:border-sky-500 data-[state=checked]:bg-sky-500"
            />
            <div className="min-w-0">
              <Label htmlFor="hotline-reserve" className="cursor-pointer font-medium text-xs text-zinc-300">
                Are you on hotline reserve?
              </Label>
              <p className="mt-0.5 text-[10px] text-zinc-600 leading-4">If you are NOT Anthony, the answer is probably No.</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <ModeButton
              active={mode === "shift"}
              color="sky"
              description="When you are at work"
              icon={<CalendarClock />}
              label="Working shift"
              number={1}
              onClick={() => setMode("shift")}
            />
            <ModeButton
              active={mode === "breaks"}
              color="amber"
              description="Lunch and blockages"
              icon={<Coffee />}
              label="Breaks"
              number={2}
              onClick={() => setMode("breaks")}
            />
          </div>
        </div>

        <ScrollArea className="min-h-80 flex-1">
          <div className="p-5">
            <div className="mb-3 flex items-center justify-between gap-3 text-xs">
              <span className="text-zinc-400">Drag across the grid to {mode === "shift" ? "set your shift" : "add breaks"}.</span>
              <span className="shrink-0 text-zinc-500 tabular-nums">7:30 AM–8 PM</span>
            </div>

            <div className="grid touch-none select-none grid-cols-[3.5rem_repeat(5,minmax(0,1fr))] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/45">
              <div className="border-zinc-800 border-r border-b bg-zinc-950/70" />
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="border-zinc-800 not-last:border-r border-b bg-zinc-950/70 py-2 text-center font-medium text-xs text-zinc-400"
                >
                  {DAY_LABELS[day]}
                </div>
              ))}

              {TIME_SLOTS.map((time, slotIndex) => (
                <TimeSlotRow
                  key={time}
                  time={time}
                  slotIndex={slotIndex}
                  mode={mode}
                  week={week}
                  onPointerDown={startPainting}
                  onPointerEnter={continuePainting}
                />
              ))}

              <div className="border-zinc-800 border-r bg-zinc-950/60 py-1 pr-2 text-right text-[10px] text-zinc-600">8 PM</div>
              {DAYS.map((day) => (
                <div key={day} className="h-5 not-last:border-zinc-800 not-last:border-r bg-zinc-950/30" />
              ))}
            </div>
          </div>
        </ScrollArea>

        <div className="shrink-0 border-zinc-800 border-t px-5 py-3">
          <div className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 text-zinc-500">
              <Legend color="bg-sky-500" label="Shift" />
              <Legend color="bg-amber-400" label="Break" />
            </div>
            <span className="text-zinc-400 tabular-nums">
              {shiftHours}h shift · {breakHours}h breaks
            </span>
          </div>

          {saveError && <p className="mt-2 text-red-300 text-xs">{saveError}</p>}

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className={cn("text-xs", isSaved ? "text-emerald-400" : "text-zinc-600")}>
              {isSaved
                ? didQueueRecompute && (scheduleState?.status === "PENDING" || scheduleState?.status === "SOLVING")
                  ? "Saved · Recomputing duties…"
                  : "Availability saved"
                : isDirty
                  ? "Unsaved changes"
                  : profile === undefined
                    ? "Loading profile…"
                    : profile
                      ? "Availability is up to date."
                      : "Add availability to create your profile."}
            </span>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving || profile === undefined || !isDirty}
              className="bg-sky-500 text-sky-950 hover:bg-sky-400"
            >
              {isSaving ? <LoaderCircle className="animate-spin" /> : isSaved ? <Check /> : <Save />}
              {isSaving ? "Saving…" : isSaved ? "Saved" : "Save availability"}
            </Button>
          </div>
        </div>
      </section>

      <GeneratedDutiesPanel profile={profile} state={scheduleState} />
    </div>
  );
}

function formatDutyTime(time: string) {
  return formatTime(parseTime(time));
}

function formatDutyRanges(ranges: TimeRange[]) {
  return ranges.map((range) => `${formatDutyTime(range.start)}–${formatDutyTime(range.end)}`).join(", ");
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
        <AlertTriangle className="size-3" />
        Needs attention
      </span>
    );
  }

  if (state?.status === "READY") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-300 text-xs">
        <Check className="size-3" />
        Up to date
      </span>
    );
  }

  return null;
}

function GeneratedDutiesPanel({
  profile,
  state,
}: {
  profile: HotlineProfile | null | undefined;
  state: HotlineScheduleState | null | undefined;
}) {
  const generated = profile?.generatedWeeklySchedule;
  const failed = state?.status === "INFEASIBLE" || state?.status === "FAILED";

  return (
    <section className="min-h-[28rem] min-w-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.07),transparent_48%)] p-5 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium text-sky-400 text-xs uppercase tracking-[0.18em]">Generated coverage</p>
            <h3 className="mt-1 font-semibold text-xl text-zinc-100">Your hotline duties</h3>
            <p className="mt-1 max-w-2xl text-sm text-zinc-500">Your assignment updates automatically when anyone changes their availability.</p>
          </div>
          <ScheduleStatus state={state} />
        </div>

        {failed && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-300" />
            <div>
              <p className="font-medium text-red-200">
                {state.status === "INFEASIBLE" ? "The current availability cannot cover every hotline slot." : "The scheduler could not finish."}
              </p>
              {state.error && <p className="mt-1 text-red-300/70 text-xs">{state.error}</p>}
              {generated && <p className="mt-1 text-xs text-zinc-500">Your last valid schedule is still shown below.</p>}
            </div>
          </div>
        )}

        {generated ? (
          <>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950/45 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <ShieldCheck className="size-4 text-sky-400" />
                <span>{profile.displayName}</span>
                {profile.schedulingClass === "RESERVE" && (
                  <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-300 uppercase tracking-wide">Reserve</span>
                )}
              </div>
              {generated.generatedAt && (
                <span className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                  <Clock3 className="size-3" />
                  Updated {new Date(generated.generatedAt).toLocaleString()}
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-3 xl:grid-cols-5">
              {DAYS.map((day) => (
                <DutyDay key={day} day={day} schedule={generated.schedule[day]} />
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 rounded-xl border border-zinc-800/80 bg-zinc-950/30 px-4 py-3 text-xs text-zinc-500">
              <Legend color="bg-sky-400" label="Available" />
              <Legend color="bg-amber-300" label="Focused · last available" />
              <Legend color="bg-violet-400" label="Solo coverage" />
              <Legend color="bg-zinc-600" label="Break / blocked" />
            </div>
          </>
        ) : (
          <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/35 p-8 text-center shadow-black/10 shadow-xl">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-300">
              {state?.status === "PENDING" || state?.status === "SOLVING" ? (
                <LoaderCircle className="size-5 animate-spin" />
              ) : (
                <Sparkles className="size-5" />
              )}
            </div>
            <h3 className="mt-4 font-semibold text-zinc-200">
              {state?.status === "PENDING" || state?.status === "SOLVING" ? "Building your weekly duties" : "Weekly duties will appear here"}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 leading-6">
              Once there is enough availability from the team, Redwood will balance hotline coverage, focused-work time, and breaks.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function DutyDay({
  day,
  schedule,
}: {
  day: Day;
  schedule: NonNullable<NonNullable<HotlineProfile["generatedWeeklySchedule"]>["schedule"][Day]> | null;
}) {
  return (
    <article className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/45">
      <div className="border-zinc-800 border-b bg-zinc-900/45 px-3 py-2.5 font-medium text-sm text-zinc-300">{DAY_LABELS[day]}</div>
      <div className="space-y-3 p-3">
        {!schedule ? (
          <p className="py-2 text-center text-xs text-zinc-600">Out of office</p>
        ) : (
          <>
            <DutyRange color="bg-sky-400" label="Available" ranges={schedule.available} />
            <DutyRange color="bg-amber-300" label="Focused" ranges={schedule.lastAvailable} />
            <DutyRange color="bg-violet-400" label="Solo" ranges={schedule.solo} />
            <DutyRange color="bg-zinc-600" label="Blocked" ranges={schedule.breaks} />
          </>
        )}
      </div>
    </article>
  );
}

function DutyRange({ color, label, ranges }: { color: string; label: string; ranges: TimeRange[] }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 font-medium text-[10px] text-zinc-500 uppercase tracking-wide">
        <span className={cn("size-1.5 rounded-full", color)} />
        {label}
      </div>
      <p className={cn("mt-1 text-xs leading-5", ranges.length > 0 ? "text-zinc-300" : "text-zinc-700")}>
        {ranges.length > 0 ? formatDutyRanges(ranges) : "—"}
      </p>
    </div>
  );
}

function ModeButton({
  active,
  color,
  description,
  icon,
  label,
  number,
  onClick,
}: {
  active: boolean;
  color: "amber" | "sky";
  description: string;
  icon: ReactNode;
  label: string;
  number: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60",
        active && color === "sky" && "border-sky-500/50 bg-sky-500/10",
        active && color === "amber" && "border-amber-400/50 bg-amber-400/10",
        !active && "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/70"
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full font-bold text-[10px]",
            active && color === "sky" && "bg-sky-400 text-sky-950",
            active && color === "amber" && "bg-amber-300 text-amber-950",
            !active && "bg-zinc-800 text-zinc-500"
          )}
        >
          {number}
        </span>
        <span className={cn("[&_svg]:size-4", active ? "text-zinc-200" : "text-zinc-500")}>{icon}</span>
        <span className={cn("font-medium text-sm", active ? "text-zinc-100" : "text-zinc-400")}>{label}</span>
      </span>
      <span className="mt-1.5 block pl-7 text-[11px] text-zinc-500">{description}</span>
    </button>
  );
}

function TimeSlotRow({
  mode,
  onPointerDown,
  onPointerEnter,
  slotIndex,
  time,
  week,
}: {
  mode: EditorMode;
  onPointerDown: (day: Day, slotIndex: number) => void;
  onPointerEnter: (day: Day, slotIndex: number) => void;
  slotIndex: number;
  time: number;
  week: WeeklyAvailability;
}) {
  const showTime = slotIndex === 0 || time % 60 === 0;

  return (
    <>
      <div className="flex h-6 items-start justify-end border-zinc-800 border-r bg-zinc-950/60 pr-2 text-[10px] text-zinc-600 tabular-nums">
        {showTime ? formatTime(time).replace(" AM", "a").replace(" PM", "p") : null}
      </div>
      {DAYS.map((day) => {
        const isShift = week[day].shift[slotIndex];
        const isBreak = week[day].breaks[slotIndex];
        const isUnavailableForMode = mode === "breaks" && !isShift;
        const label = `${DAY_LABELS[day]}, ${formatTime(time)}–${formatTime(time + SLOT_MINUTES)}`;

        return (
          <button
            key={day}
            type="button"
            onPointerDown={(event) => {
              event.preventDefault();
              onPointerDown(day, slotIndex);
            }}
            onPointerEnter={() => onPointerEnter(day, slotIndex)}
            aria-label={`${label}: ${isBreak ? "break" : isShift ? "working" : "out of office"}`}
            aria-pressed={isBreak || isShift}
            disabled={isUnavailableForMode}
            title={label}
            className={cn(
              "h-6 border-zinc-800 border-r border-b transition-colors last:border-r-0 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
              !isShift && "bg-zinc-900/30",
              isShift && !isBreak && "bg-sky-500/75 hover:bg-sky-400/85",
              isBreak && "bg-amber-400/85 hover:bg-amber-300",
              isUnavailableForMode && "cursor-not-allowed opacity-35"
            )}
          />
        );
      })}
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2 rounded-sm", color)} />
      {label}
    </span>
  );
}
