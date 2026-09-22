import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { Input } from "@redwood/shad-ui/components/input";
import { Label } from "@redwood/shad-ui/components/label";
import type { Dispatch, SetStateAction } from "react";
import { SERVICE_STATUSES, type ServiceStatus } from "../model/shift-results";

type ShiftFiltersProps = {
  minimumOpening: string;
  minimumIsValid: boolean;
  excludeTasks: boolean;
  excludeIssues: boolean;
  serviceStatuses: ServiceStatus[];
  setMinimumOpening: (value: string) => void;
  setExcludeTasks: (value: boolean) => void;
  setExcludeIssues: (value: boolean) => void;
  setServiceStatuses: Dispatch<SetStateAction<ServiceStatus[]>>;
};

export function ShiftFilters({
  minimumOpening,
  minimumIsValid,
  excludeTasks,
  excludeIssues,
  serviceStatuses,
  setMinimumOpening,
  setExcludeTasks,
  setExcludeIssues,
  setServiceStatuses,
}: ShiftFiltersProps) {
  return (
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
  );
}
