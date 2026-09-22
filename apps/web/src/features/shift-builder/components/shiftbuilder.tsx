"use client";
import { api } from "@backend/convex/_generated/api";
import { Button } from "@redwood/shad-ui/components/button";
import { useConvex } from "convex/react";
import { Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { WEEKDAY_KEYS } from "#/util/date-time-utils.ts";
import { findShiftOpenings, MINUTES_PER_DAY } from "../model/availability";
import { getServiceStatus, SERVICE_STATUSES, type ServiceStatus, type ShiftMatch } from "../model/shift-results";
import { MaintenanceTimeInput } from "./maintenance-time-input";
import { ShiftFilters } from "./shift-filters";
import { ShiftForm } from "./shift-form";
import { ShiftResults } from "./shift-results";

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
  const [matches, setMatches] = useState<ShiftMatch[] | null>(null);
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

  function resetResults() {
    setMatches(null);
    setSummary(null);
    setError(null);
  }

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
          <ShiftForm
            shiftDate={shiftDate}
            isLoading={isLoading}
            error={error}
            summary={summary}
            onSubmit={handleStart}
            onChange={resetResults}
            onDateChange={(date) => {
              setShiftDate(date);
              resetResults();
            }}
            onTimeChange={() => setError(null)}
          />
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
            <MaintenanceTimeInput
              maintenanceMinutes={maintenanceMinutes}
              shiftDuration={shiftDuration}
              setMaintenanceMinutes={setMaintenanceMinutes}
            />
            <ShiftFilters
              minimumOpening={minimumOpening}
              minimumIsValid={minimumIsValid}
              excludeTasks={excludeTasks}
              excludeIssues={excludeIssues}
              serviceStatuses={serviceStatuses}
              setMinimumOpening={setMinimumOpening}
              setExcludeTasks={setExcludeTasks}
              setExcludeIssues={setExcludeIssues}
              setServiceStatuses={setServiceStatuses}
            />
            <ShiftResults matches={visibleMatches} />
          </section>
        )}
      </div>
    </div>
  );
}
