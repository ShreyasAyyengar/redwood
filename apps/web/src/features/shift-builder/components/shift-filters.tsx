import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { Label } from "@redwood/shad-ui/components/label";
import type { Dispatch, SetStateAction } from "react";
import { SERVICE_STATUSES, type ServiceStatus } from "../model/shift-results";

type ShiftFiltersProps = {
  excludeTasks: boolean;
  excludeIssues: boolean;
  serviceStatuses: ServiceStatus[];
  setExcludeTasks: (value: boolean) => void;
  setExcludeIssues: (value: boolean) => void;
  setServiceStatuses: Dispatch<SetStateAction<ServiceStatus[]>>;
};

export function ShiftFilters({
  excludeTasks,
  excludeIssues,
  serviceStatuses,
  setExcludeTasks,
  setExcludeIssues,
  setServiceStatuses,
}: ShiftFiltersProps) {
  return (
    <fieldset className="space-y-4 rounded-xl border bg-neutral-900/50 p-5">
      <legend className="px-2 font-semibold">Filter classrooms</legend>
      <div className="grid gap-6 md:grid-cols-2">
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
