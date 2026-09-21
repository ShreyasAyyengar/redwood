"use client";

import { api } from "@backend/convex/_generated/api";
import { Button } from "@redwood/shad-ui/components/button";
import { Calendar } from "@redwood/shad-ui/components/calendar";
import { Card, CardContent, CardDescription, CardHeader } from "@redwood/shad-ui/components/card";
import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { Input } from "@redwood/shad-ui/components/input";
import { Label } from "@redwood/shad-ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@redwood/shad-ui/components/popover";
import { useConvex } from "convex/react";
import { CalendarDays, ChevronDownIcon, CircleAlert, Loader2, OctagonPause, ThumbsUp, TriangleAlert, WandSparkles } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import type { ClassroomSummary } from "#/features/classrooms/model/classroom-types.ts";
import { convertMinutesToReadable, daysAgoNumeric, getDateTimeDisplay, WEEKDAY_KEYS } from "#/util/date-time-utils.ts";
import { findShiftOpenings, MINUTES_PER_DAY } from "../model/availability";

import { ShiftTimePicker } from "./shift-time-picker";

const SERVICE_STATUSES = ["Up to Date", "Pending", "Overdue", "No Record Yet"] as const;
type ServiceStatus = (typeof SERVICE_STATUSES)[number];

type Match = { room: ClassroomSummary; openings: ReturnType<typeof findShiftOpenings> };

export function ShiftBuilder() {
  const convex = useConvex();
  const [maintenanceMinutes, setMaintenanceMinutes] = useState("");
  const [shiftDuration, setShiftDuration] = useState(MINUTES_PER_DAY - 1);
  const [minimumOpening, setMinimumOpening] = useState("");
  const [excludeTasks, setExcludeTasks] = useState(false);
  const [excludeIssues, setExcludeIssues] = useState(false);
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([...SERVICE_STATUSES]);
  const minimumIsValid = minimumOpening === "" || (Number.isInteger(Number(minimumOpening)) && Number(minimumOpening) >= 0);
  const [shiftDate, setShiftDate] = useState(() => {
    const pacificDate = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    }).format(new Date());
    return new Date(pacificDate);
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleMatches =
    matches?.flatMap(({ room, openings }) => {
      if (excludeTasks && room.openTasksCount > 0) return [];
      if (excludeIssues && room.roomStatus !== "GOOD") return [];
      if (!serviceStatuses.includes(getServiceStatus(room))) return [];
      const threshold = minimumIsValid ? Number(minimumOpening) : 0;
      const visibleOpenings = openings.filter((block) => block.endTimeMin - block.startTimeMin > threshold);
      return visibleOpenings.length ? [{ room, openings: visibleOpenings }] : [];
    }) ?? [];

  async function handleStart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const start = String(data.get("shiftStart"));
    const end = String(data.get("shiftEnd"));

    const toMinutes = (time: string) => {
      const [hours = 0, minutes = 0] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };
    const duration = (toMinutes(end) - toMinutes(start) + MINUTES_PER_DAY) % MINUTES_PER_DAY;

    if (duration === 0) {
      setError("Choose different start and end times for your shift.");
      return;
    }
    setShiftDuration(duration);

    setError(null);
    setMatches(null);
    setIsLoading(true);
    const weekdayKey = WEEKDAY_KEYS[shiftDate.getDay()] ?? "sunday";
    setSummary(`${shiftDate.toLocaleDateString("en-US")} (${weekdayKey}), ${start}–${end}${end < start ? " (next day)" : ""} Pacific time`);
    try {
      const rooms = await convex.query(api.core.classrooms.service.getAllRooms, {});
      setMatches(
        rooms.flatMap((room) => {
          const openings = findShiftOpenings(room.schedule, weekdayKey, toMinutes(start), toMinutes(end), 1);
          return openings.length > 0 ? [{ room, openings }] : [];
        })
      );
    } catch {
      setError("Could not load classroom availability. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-0 w-full flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-7xl py-6">
        <div hidden={isLoading || matches !== null} className="mx-auto max-w-lg">
          <Card>
            <CardHeader>
              <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <WandSparkles className="size-5" aria-hidden="true" />
              </div>
              <h1 className="font-semibold text-2xl tracking-tight">Shift Builder</h1>
              <CardDescription>Choose a date and shift hours to find available classrooms. All times are Pacific.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form
                className="space-y-6"
                onSubmit={handleStart}
                onChange={() => {
                  setMatches(null);
                  setSummary(null);
                  setError(null);
                }}
              >
                <fieldset disabled={isLoading} className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Label htmlFor="shift-date">Shift date</Label>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button id="shift-date" type="button" variant="outline" className="gap-3">
                          <CalendarDays aria-hidden="true" />
                          {shiftDate.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })}
                          <ChevronDownIcon aria-hidden="true" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={shiftDate}
                          defaultMonth={shiftDate}
                          onSelect={(date) => {
                            if (!date) return;
                            setShiftDate(date);
                            setCalendarOpen(false);
                            setError(null);
                            setSummary(null);
                            setMatches(null);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-4">
                    <ShiftTimePicker id="shift-start" name="shiftStart" label="Shift starts" onChange={() => setError(null)} />
                    <ShiftTimePicker id="shift-end" name="shiftEnd" label="Shift ends" onChange={() => setError(null)} />
                  </div>
                  <p id="shift-help" className="text-muted-foreground text-xs">
                    An end time earlier than the start time means your shift ends the next day.
                  </p>

                  {error && (
                    <p role="alert" className="text-destructive text-sm">
                      {error}
                    </p>
                  )}
                  <Button type="submit" className="w-full">
                    {isLoading ? "Finding classrooms…" : "Start"}
                  </Button>
                </fieldset>
                <div role="status" aria-live="polite">
                  {summary && <p className="rounded-lg border bg-muted/50 p-4 text-sm leading-relaxed">{summary}</p>}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
        {isLoading && (
          <div role="status" className="flex min-h-[60vh] flex-col items-center justify-center gap-3" aria-live="polite">
            <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
            <p>Finding available classrooms…</p>
          </div>
        )}
        {matches !== null && (
          <section className="space-y-6" aria-label="Available classrooms">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-semibold text-2xl">Available classrooms</h1>
                <p className="mt-2 text-muted-foreground text-sm">{summary}</p>
              </div>
              <Button variant="outline" onClick={() => setMatches(null)}>
                Edit shift
              </Button>
            </div>
            <div className="max-w-sm space-y-2 rounded-lg border p-4">
              <Label htmlFor="maintenance-time">Average maintenance time (minutes)</Label>
              <Input
                id="maintenance-time"
                name="maintenanceMinutes"
                type="number"
                min={1}
                max={shiftDuration}
                step={1}
                placeholder="e.g. 30"
                value={maintenanceMinutes}
                onChange={(event) => setMaintenanceMinutes(event.target.value)}
                aria-describedby="maintenance-help"
              />
              <p id="maintenance-help" className="text-muted-foreground text-xs">
                Enter the average time for one maintenance visit.
              </p>
              {maintenanceMinutes !== "" &&
                (!Number.isInteger(Number(maintenanceMinutes)) ||
                  Number(maintenanceMinutes) < 1 ||
                  Number(maintenanceMinutes) > shiftDuration) && (
                  <p role="alert" className="text-destructive text-sm">
                    Enter a whole number between 1 and {shiftDuration} minutes.
                  </p>
                )}
            </div>
            <fieldset className="space-y-4 rounded-xl border bg-neutral-900/50 p-5">
              <legend className="px-2 font-semibold">Filter classrooms</legend>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="minimum-opening">Opening longer than (minutes)</Label>
                  <Input
                    id="minimum-opening"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="e.g. 15"
                    value={minimumOpening}
                    onChange={(event) => setMinimumOpening(event.target.value)}
                    aria-invalid={!minimumIsValid}
                    aria-describedby="minimum-opening-help"
                  />
                  <p id="minimum-opening-help" className="text-muted-foreground text-xs">
                    Only show openings longer than this duration. Leave blank to show all.
                  </p>
                  {!minimumIsValid && (
                    <p role="alert" className="text-destructive text-sm">
                      Enter a whole number of 0 or more.
                    </p>
                  )}
                </div>
                <fieldset className="space-y-3">
                  <legend className="mb-3 font-medium text-sm">Exclude rooms with</legend>
                  <Label className="flex items-center gap-2">
                    <Checkbox checked={excludeTasks} onCheckedChange={(checked) => setExcludeTasks(checked === true)} />
                    Open tasks
                  </Label>
                  <Label className="flex items-center gap-2">
                    <Checkbox checked={excludeIssues} onCheckedChange={(checked) => setExcludeIssues(checked === true)} />
                    Unresolved issues (including on hold)
                  </Label>
                </fieldset>
                <fieldset className="space-y-3">
                  <legend className="mb-3 font-medium text-sm">Maintenance status to show</legend>
                  {SERVICE_STATUSES.map((status) => (
                    <Label key={status} className="flex items-center gap-2">
                      <Checkbox
                        checked={serviceStatuses.includes(status)}
                        onCheckedChange={(checked) =>
                          setServiceStatuses((current) => (checked === true ? [...current, status] : current.filter((item) => item !== status)))
                        }
                      />
                      {status}
                    </Label>
                  ))}
                </fieldset>
              </div>
            </fieldset>
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
              {visibleMatches.map(({ room, openings }) => (
                <Link
                  key={room._id}
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
              ))}
            </div>{" "}
          </section>
        )}
      </div>
    </div>
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

function getServiceStatus(room: ClassroomSummary): ServiceStatus {
  if (!room.lastMaintenance) return "No Record Yet";
  const days = daysAgoNumeric(new Date(room.lastMaintenance.date));
  const recentDays = 14;
  const overdueDays = 30;
  return days < recentDays ? "Up to Date" : days <= overdueDays ? "Pending" : "Overdue";
}
