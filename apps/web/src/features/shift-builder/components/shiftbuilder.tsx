"use client";
import { api } from "@backend/convex/_generated/api";
import { Button } from "@redwood/shad-ui/components/button";
import { useConvex } from "convex/react";
import { ArrowLeft, Loader2, WandSparkles } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { WEEKDAY_KEYS } from "#/util/date-time-utils.ts";
import { findShiftOpenings, MINUTES_PER_DAY } from "../model/availability";
import { createTravelMatrix, planShiftRoute, type ShiftRoute, type TravelMatrix } from "../model/route-planner";
import { getServiceStatus, SERVICE_STATUSES, type ServiceStatus, type ShiftMatch } from "../model/shift-results";
import { MaintenanceTimeInput } from "./maintenance-time-input";
import { ShiftFilters } from "./shift-filters";
import { ShiftForm } from "./shift-form";
import { ShiftResults } from "./shift-results";
import { ShiftRouteResults } from "./shift-route-results";

export function ShiftBuilder() {
  const convex = useConvex();
  const [maintenanceMinutes, setMaintenanceMinutes] = useState("");
  const [shiftDuration, setShiftDuration] = useState(MINUTES_PER_DAY - 1);
  const [shiftStart, setShiftStart] = useState(0);
  const [travelMatrix, setTravelMatrix] = useState<TravelMatrix>({ buildings: [], minutes: [] });
  const [excludeTasks, setExcludeTasks] = useState(false);
  const [excludeIssues, setExcludeIssues] = useState(false);
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([...SERVICE_STATUSES]);
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
  const [route, setRoute] = useState<ShiftRoute | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const visibleMatches = useMemo(
    () =>
      matches?.filter(
        ({ room }) =>
          !(excludeTasks && room.openTasksCount > 0) &&
          !(excludeIssues && room.roomStatus !== "GOOD") &&
          serviceStatuses.includes(getServiceStatus(room))
      ) ?? [],
    [matches, excludeTasks, excludeIssues, serviceStatuses]
  );
  const maintenanceIsValid =
    Number.isInteger(Number(maintenanceMinutes)) && Number(maintenanceMinutes) >= 1 && Number(maintenanceMinutes) <= shiftDuration;

  async function generateSchedule() {
    if (!maintenanceIsValid || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      // Allow the busy state to paint before starting the bounded search.
      await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
      setRoute(planShiftRoute(visibleMatches, shiftStart, shiftStart + shiftDuration, Number(maintenanceMinutes), travelMatrix));
    } catch {
      setError("Could not generate your schedule. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  function resetResults() {
    setMatches(null);
    setRoute(null);
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
    setShiftStart(toMinutes(start));

    setError(null);
    setMatches(null);
    setIsLoading(true);
    const weekdayKey = WEEKDAY_KEYS[shiftDate.getDay()] ?? "sunday";
    setSummary(`${shiftDate.toLocaleDateString("en-US")} (${weekdayKey}), ${start}–${end}${end < start ? " (next day)" : ""} Pacific time`);
    try {
      const [rooms, groups] = await Promise.all([
        convex.query(api.core.classrooms.service.getAllRooms, {}),
        convex.query(api.core.groups.service.getGroups, {}),
      ]);
      setTravelMatrix(
        createTravelMatrix(
          groups.map((group) => group.label),
          rooms.map((room) => room.groupKey)
        )
      );
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
        <div hidden={isLoading || matches !== null} className="mx-auto max-w-2xl">
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
        {matches !== null && route !== null && (
          <section className="space-y-6" aria-label="Generated schedule">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-semibold text-2xl">Shift schedule</h1>
                <p className="mt-2 text-muted-foreground text-sm">{summary}</p>
              </div>
              <Button variant="outline" onClick={() => setRoute(null)}>
                <ArrowLeft aria-hidden="true" />
                Back to filters
              </Button>
            </div>
            <ShiftRouteResults route={route} shiftStart={shiftStart} shiftEnd={shiftStart + shiftDuration} />
          </section>
        )}
        {matches !== null && route === null && (
          <section className="space-y-6" aria-label="Schedule settings">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="font-semibold text-2xl">Build your schedule</h1>
                <p className="mt-2 text-muted-foreground text-sm">{summary}</p>
                <p className="mt-2 text-muted-foreground text-sm">
                  Choose your maintenance time and filters, then click Generate schedule to plan your shift.
                </p>
              </div>
              <Button variant="outline" disabled={isGenerating} onClick={resetResults}>
                Edit shift
              </Button>
            </div>
            <fieldset className="space-y-6" disabled={isGenerating}>
              <MaintenanceTimeInput
                maintenanceMinutes={maintenanceMinutes}
                shiftDuration={shiftDuration}
                setMaintenanceMinutes={setMaintenanceMinutes}
              />
              <ShiftFilters
                excludeTasks={excludeTasks}
                excludeIssues={excludeIssues}
                serviceStatuses={serviceStatuses}
                setExcludeTasks={setExcludeTasks}
                setExcludeIssues={setExcludeIssues}
                setServiceStatuses={setServiceStatuses}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" disabled={!maintenanceIsValid || isGenerating} onClick={generateSchedule}>
                  {isGenerating ? <Loader2 className="animate-spin" aria-hidden="true" /> : <WandSparkles aria-hidden="true" />}
                  {isGenerating ? "Generating schedule…" : "Generate schedule"}
                </Button>
                {!maintenanceIsValid && <p className="text-muted-foreground text-sm">Enter a valid average maintenance time to continue.</p>}
              </div>
            </fieldset>
            {isGenerating && (
              <p role="status" className="text-muted-foreground text-sm">
                Finding a route for your shift…
              </p>
            )}
            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}
            <section className="space-y-4" aria-label="Classroom availability preview">
              <p className="text-muted-foreground text-sm">
                Preview classrooms available during your shift that match your filters. Generate schedule to plan the visit order.
              </p>
              <ShiftResults matches={visibleMatches} />
            </section>
          </section>
        )}
      </div>
    </div>
  );
}
