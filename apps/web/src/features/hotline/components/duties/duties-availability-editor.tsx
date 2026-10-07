"use client";

import { api } from "@backend/convex/_generated/api";
import type { Doc } from "@backend/convex/_generated/dataModel";
import { Button } from "@redwood/shad-ui/components/button";
import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { Input } from "@redwood/shad-ui/components/input";
import { Label } from "@redwood/shad-ui/components/label";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@redwood/shad-ui/components/select";
import { Switch } from "@redwood/shad-ui/components/switch";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { CalendarClock, Check, Coffee, Eye, LoaderCircle, LockKeyhole, RotateCcw, Save, UserRound, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DutiesSchedulePanel } from "./duties-schedule-panel.tsx";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const DAY_LABELS: Record<Day, string> = { friday: "Fri", monday: "Mon", thursday: "Thu", tuesday: "Tue", wednesday: "Wed" };
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
const SELF_PROFILE_VALUE = "__self__";
const PROFILE_COLORS = ["bg-cyan-400", "bg-fuchsia-400", "bg-lime-400", "bg-orange-400", "bg-indigo-400", "bg-rose-400"];

type Day = (typeof DAYS)[number];
type EditorMode = "shift" | "breaks";
type DayAvailability = { breaks: boolean[]; shift: boolean[] };
type WeeklyAvailability = Record<Day, DayAvailability>;
type DragState = { mode: EditorMode; value: boolean } | undefined;
type HotlineProfile = Doc<"hotlineProfiles">;
type AvailabilityProfile = HotlineProfile["availabilityProfile"];
type TimeRange = { end: string; start: string };

function createEmptyWeek(): WeeklyAvailability {
  return Object.fromEntries(
    DAYS.map((day) => [day, { breaks: Array.from({ length: SLOT_COUNT }, () => false), shift: Array.from({ length: SLOT_COUNT }, () => false) }])
  ) as WeeklyAvailability;
}

function formatTime(minutes: number) {
  const hour = Math.floor(minutes / MINUTES_PER_HOUR);
  const minute = minutes % MINUTES_PER_HOUR;
  const displayHour = hour % HOURS_PER_HALF_DAY || HOURS_PER_HALF_DAY;
  return `${displayHour}${minute === 0 ? "" : `:${String(minute).padStart(2, "0")}`} ${hour < HOURS_PER_HALF_DAY ? "AM" : "PM"}`;
}

function parseTime(time: string) {
  const [hour = "0", minute = "0"] = time.split(":");
  return Number(hour) * MINUTES_PER_HOUR + Number(minute);
}

function serializeTime(minutes: number) {
  return `${String(Math.floor(minutes / MINUTES_PER_HOUR)).padStart(2, "0")}:${String(minutes % MINUTES_PER_HOUR).padStart(2, "0")}`;
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
      ranges.push({ start: serializeTime(START_MINUTES + rangeStart * SLOT_MINUTES), end: serializeTime(START_MINUTES + index * SLOT_MINUTES) });
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
      return [day, { shift: shiftRanges[0], blockages: serializeRanges(week[day].breaks) }];
    })
  ) as AvailabilityProfile;
}

function getSelectedHours(week: WeeklyAvailability, key: keyof DayAvailability) {
  return DAYS.reduce((total, day) => total + week[day][key].filter(Boolean).length, 0) * (SLOT_MINUTES / MINUTES_PER_HOUR);
}

function getAvailabilityState(profile: HotlineProfile, day: Day, start: number) {
  const availability = profile.availabilityProfile[day];
  if (!availability || start < parseTime(availability.shift.start) || start >= parseTime(availability.shift.end)) return "off" as const;
  if (availability.blockages.some((blockage) => start >= parseTime(blockage.start) && start < parseTime(blockage.end))) return "break" as const;
  return "working" as const;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Your availability could not be saved. Please try again.";
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: editor, read-only, and overlay states intentionally share one controller.
export function DutiesAvailabilityEditor({ canRecomputeSchedule, defaultName }: { canRecomputeSchedule: boolean; defaultName: string }) {
  const profile = useQuery(api.core.hotline.schedule.service.getCurrentHotlineStaffProfile, {});
  const profiles = useQuery(api.core.hotline.schedule.service.getHotlineStaffProfiles, {});
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
  const [selectedProfileId, setSelectedProfileId] = useState(SELF_PROFILE_VALUE);
  const [showEveryone, setShowEveryone] = useState(false);
  const dragState = useRef<DragState>(undefined);
  const hasLoadedProfile = useRef(false);

  useEffect(() => {
    if (profile === undefined || hasLoadedProfile.current) return;
    hasLoadedProfile.current = true;
    if (profile) {
      setEmployeeName(profile.displayName);
      setIsReserve(profile.schedulingClass === "RESERVE");
      setWeek(createWeekFromProfile(profile.availabilityProfile));
      setSelectedProfileId(profile._id);
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

  const sortedProfiles = useMemo(
    () => [...(profiles ?? [])].sort((left, right) => left.displayName.localeCompare(right.displayName)),
    [profiles]
  );
  const selectedProfile =
    selectedProfileId === SELF_PROFILE_VALUE ? (profile ?? undefined) : sortedProfiles.find((candidate) => candidate._id === selectedProfileId);
  const viewingOwnProfile =
    !showEveryone && (selectedProfileId === SELF_PROFILE_VALUE || Boolean(profile && selectedProfile?._id === profile._id));
  const displayedWeek = useMemo(
    () => (viewingOwnProfile ? week : selectedProfile ? createWeekFromProfile(selectedProfile.availabilityProfile) : createEmptyWeek()),
    [selectedProfile, viewingOwnProfile, week]
  );
  const shiftHours = useMemo(() => getSelectedHours(displayedWeek, "shift"), [displayedWeek]);
  const breakHours = useMemo(() => getSelectedHours(displayedWeek, "breaks"), [displayedWeek]);

  const markChanged = () => {
    setIsDirty(true);
    setIsSaved(false);
    setDidQueueRecompute(false);
    setSaveError(undefined);
  };

  const paintCell = useCallback((day: Day, slotIndex: number, editorMode: EditorMode, value: boolean) => {
    setWeek((current) => {
      const currentDay = current[day];
      if (editorMode === "breaks" && !currentDay.shift[slotIndex]) return current;
      const shift = [...currentDay.shift];
      const breaks = [...currentDay.breaks];
      if (editorMode === "shift") {
        shift[slotIndex] = value;
        if (!value) breaks[slotIndex] = false;
      } else breaks[slotIndex] = value;
      return { ...current, [day]: { breaks, shift } };
    });
    setIsDirty(true);
    setIsSaved(false);
    setDidQueueRecompute(false);
    setSaveError(undefined);
  }, []);

  const startPainting = (day: Day, slotIndex: number) => {
    if (!viewingOwnProfile) return;
    const cell = week[day];
    if (mode === "breaks" && !cell.shift[slotIndex]) return;
    const value = mode === "shift" ? !cell.shift[slotIndex] : !cell.breaks[slotIndex];
    dragState.current = { mode, value };
    paintCell(day, slotIndex, mode, value);
  };

  const continuePainting = (day: Day, slotIndex: number) => {
    const drag = dragState.current;
    if (drag && viewingOwnProfile) paintCell(day, slotIndex, drag.mode, drag.value);
  };

  const clearAvailability = () => {
    setWeek(createEmptyWeek());
    setMode("shift");
    markChanged();
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
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-zinc-100">
                  {showEveryone
                    ? "Everyone’s availability"
                    : viewingOwnProfile
                      ? "Your availability"
                      : `${selectedProfile?.displayName ?? "Staff"}’s availability`}
                </h3>
                {!showEveryone && !viewingOwnProfile && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 font-medium text-[9px] text-zinc-500 uppercase tracking-wide">
                    <LockKeyhole className="size-2.5" /> View only
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                {showEveryone
                  ? "Compare the whole team in one weekly view."
                  : viewingOwnProfile
                    ? "Paint your usual week in two quick steps."
                    : "Review this person’s shift and blockages."}
              </p>
            </div>
            {viewingOwnProfile && (
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
            )}
          </div>

          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="hotline-profile-view" className="text-xs text-zinc-400">
                View profile
              </Label>
              <Select
                value={selectedProfileId}
                onValueChange={(value) => {
                  setSelectedProfileId(value);
                  setShowEveryone(false);
                }}
                disabled={showEveryone || profiles === undefined}
              >
                <SelectTrigger id="hotline-profile-view" className="w-full border-zinc-700 bg-zinc-900/80 text-zinc-200">
                  <SelectValue placeholder="Choose a profile" />
                </SelectTrigger>
                <SelectContent>
                  {!profile && (
                    <SelectItem value={SELF_PROFILE_VALUE}>
                      Your profile <span className="text-[10px] text-zinc-500">New</span>
                    </SelectItem>
                  )}
                  {sortedProfiles.map((candidate) => (
                    <SelectItem key={candidate._id} value={candidate._id}>
                      <span>{candidate.displayName}</span>
                      {candidate._id === profile?._id && <span className="text-[10px] text-zinc-500">You</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex h-9 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3">
              <UsersRound className="size-3.5 text-zinc-500" />
              <Label htmlFor="show-all-availability" className="cursor-pointer whitespace-nowrap text-[11px] text-zinc-400">
                Show everyone
              </Label>
              <Switch id="show-all-availability" size="sm" checked={showEveryone} onCheckedChange={setShowEveryone} />
            </div>
          </div>

          {viewingOwnProfile ? (
            <>
              <div className="mt-4 space-y-2">
                <Label htmlFor="hotline-employee-name" className="text-xs text-zinc-400">
                  Name
                </Label>
                <div className="relative">
                  <UserRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    id="hotline-employee-name"
                    value={employeeName}
                    onChange={(event) => {
                      setEmployeeName(event.target.value);
                      markChanged();
                    }}
                    placeholder="Your name"
                    className="border-zinc-700 bg-zinc-900/80 pl-9 text-zinc-100"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-zinc-800 bg-zinc-900/35 px-3 py-2.5">
                <Checkbox
                  id="hotline-reserve"
                  checked={isReserve}
                  onCheckedChange={(checked) => {
                    setIsReserve(checked === true);
                    markChanged();
                  }}
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
            </>
          ) : (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/35 px-3 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-500">
                {showEveryone ? <UsersRound className="size-4" /> : <Eye className="size-4" />}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-xs text-zinc-300">
                  {showEveryone ? `${sortedProfiles.length} hotline profiles` : selectedProfile?.displayName}
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-600">
                  {showEveryone
                    ? "Each color is one employee; outlined cells are breaks."
                    : selectedProfile?.schedulingClass === "RESERVE"
                      ? "Hotline reserve · view only"
                      : "Standard rotation · view only"}
                </p>
              </div>
            </div>
          )}
        </div>

        <ScrollArea className="min-h-80 flex-1">
          <div className="p-5">
            <div className="mb-3 flex items-center justify-between gap-3 text-xs">
              <span className="text-zinc-400">
                {showEveryone
                  ? "The team’s working hours and breaks, layered together."
                  : viewingOwnProfile
                    ? `Drag across the grid to ${mode === "shift" ? "set your shift" : "add breaks"}.`
                    : "This profile is view-only."}
              </span>
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
                  week={displayedWeek}
                  editable={viewingOwnProfile}
                  overlayProfiles={showEveryone ? sortedProfiles : undefined}
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
            {showEveryone ? (
              <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1 text-zinc-500">
                {sortedProfiles.map((candidate, index) => (
                  <Legend
                    key={candidate._id}
                    color={PROFILE_COLORS[index % PROFILE_COLORS.length] ?? "bg-zinc-500"}
                    label={candidate.displayName}
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 text-zinc-500">
                  <Legend color="bg-sky-500" label="Shift" />
                  <Legend color="bg-amber-400" label="Break" />
                </div>
                <span className="text-zinc-400 tabular-nums">
                  {shiftHours}h shift · {breakHours}h breaks
                </span>
              </>
            )}
          </div>
          {viewingOwnProfile && saveError && <p className="mt-2 text-red-300 text-xs">{saveError}</p>}
          {viewingOwnProfile ? (
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
          ) : (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-600">
              <LockKeyhole className="size-3" /> Switch back to your profile to edit availability.
            </div>
          )}
        </div>
      </section>

      <DutiesSchedulePanel canRecomputeSchedule={canRecomputeSchedule} currentProfile={profile} profiles={profiles} state={scheduleState} />
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
  editable,
  mode,
  onPointerDown,
  onPointerEnter,
  overlayProfiles,
  slotIndex,
  time,
  week,
}: {
  editable: boolean;
  mode: EditorMode;
  onPointerDown: (day: Day, slotIndex: number) => void;
  onPointerEnter: (day: Day, slotIndex: number) => void;
  overlayProfiles?: HotlineProfile[];
  slotIndex: number;
  time: number;
  week: WeeklyAvailability;
}) {
  const showTime = slotIndex === 0 || time % MINUTES_PER_HOUR === 0;
  return (
    <>
      <div className="flex h-6 items-start justify-end border-zinc-800 border-r bg-zinc-950/60 pr-2 text-[10px] text-zinc-600 tabular-nums">
        {showTime ? formatTime(time).replace(" AM", "a").replace(" PM", "p") : null}
      </div>
      {DAYS.map((day) => {
        if (overlayProfiles) {
          return (
            <div
              key={day}
              className="flex h-6 gap-px border-zinc-800 border-r border-b bg-zinc-950/50 p-0.5 last:border-r-0"
              title={`${DAY_LABELS[day]}, ${formatTime(time)}`}
            >
              {overlayProfiles.map((profile, index) => {
                const state = getAvailabilityState(profile, day, time);
                return (
                  <span
                    key={profile._id}
                    className={cn(
                      "min-w-0 flex-1 rounded-[2px]",
                      state !== "off" && PROFILE_COLORS[index % PROFILE_COLORS.length],
                      state === "break" && "opacity-35 ring-1 ring-amber-200 ring-inset"
                    )}
                  />
                );
              })}
            </div>
          );
        }
        const isShift = week[day].shift[slotIndex];
        const isBreak = week[day].breaks[slotIndex];
        const disabledForMode = mode === "breaks" && !isShift;
        const label = `${DAY_LABELS[day]}, ${formatTime(time)}–${formatTime(time + SLOT_MINUTES)}`;
        return (
          <button
            key={day}
            type="button"
            onPointerDown={(event) => {
              if (!editable) return;
              event.preventDefault();
              onPointerDown(day, slotIndex);
            }}
            onPointerEnter={() => {
              if (editable) onPointerEnter(day, slotIndex);
            }}
            aria-label={`${label}: ${isBreak ? "break" : isShift ? "working" : "out of office"}`}
            aria-pressed={isBreak || isShift}
            disabled={!editable || disabledForMode}
            title={`${label}${editable ? "" : " · view only"}`}
            className={cn(
              "h-6 border-zinc-800 border-r border-b transition-colors last:border-r-0 focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
              !isShift && "bg-zinc-900/30",
              isShift && !isBreak && "bg-sky-500/75",
              isBreak && "bg-amber-400/85",
              editable && isShift && !isBreak && "hover:bg-sky-400/85",
              editable && isBreak && "hover:bg-amber-300",
              !editable && "cursor-default",
              disabledForMode && "cursor-not-allowed opacity-35"
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
