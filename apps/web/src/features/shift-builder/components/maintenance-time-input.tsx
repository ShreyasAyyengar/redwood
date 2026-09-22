import { Input } from "@redwood/shad-ui/components/input";
import { Label } from "@redwood/shad-ui/components/label";

type MaintenanceTimeInputProps = { maintenanceMinutes: string; shiftDuration: number; setMaintenanceMinutes: (value: string) => void };

export function MaintenanceTimeInput({ maintenanceMinutes, shiftDuration, setMaintenanceMinutes }: MaintenanceTimeInputProps) {
  return (
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
        (!Number.isInteger(Number(maintenanceMinutes)) || Number(maintenanceMinutes) < 1 || Number(maintenanceMinutes) > shiftDuration) && (
          <p role="alert" className="text-destructive text-sm">
            Enter a whole number between 1 and {shiftDuration} minutes.
          </p>
        )}
    </div>
  );
}
