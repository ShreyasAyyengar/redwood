import { Button } from "@redwood/shad-ui/components/button";
import { Calendar } from "@redwood/shad-ui/components/calendar";
import { Card, CardContent, CardDescription, CardHeader } from "@redwood/shad-ui/components/card";
import { Label } from "@redwood/shad-ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@redwood/shad-ui/components/popover";
import { CalendarDays, ChevronDownIcon, WandSparkles } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ShiftTimePicker } from "./shift-time-picker";

type ShiftFormProps = {
  shiftDate: Date;
  isLoading: boolean;
  error: string | null;
  summary: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onChange: () => void;
  onDateChange: (date: Date) => void;
  onTimeChange: () => void;
};

export function ShiftForm({ shiftDate, isLoading, error, summary, onSubmit, onChange, onDateChange, onTimeChange }: ShiftFormProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  return (
    <Card>
      <CardHeader>
        <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <WandSparkles className="size-5" aria-hidden="true" />
        </div>
        <h1 className="font-semibold text-2xl tracking-tight">Shift Builder</h1>
        <CardDescription>Choose a date and shift hours to find available classrooms. All times are Pacific.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form className="space-y-6" onSubmit={onSubmit} onChange={onChange}>
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
                      onDateChange(date);
                      setCalendarOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-4">
              <ShiftTimePicker id="shift-start" name="shiftStart" label="Shift starts" onChange={onTimeChange} />
              <ShiftTimePicker id="shift-end" name="shiftEnd" label="Shift ends" onChange={onTimeChange} />
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
  );
}
