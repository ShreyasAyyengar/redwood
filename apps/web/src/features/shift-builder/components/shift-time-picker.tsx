"use client";

import { Button } from "@redwood/shad-ui/components/button";
import { Input } from "@redwood/shad-ui/components/input";
import { Label } from "@redwood/shad-ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@redwood/shad-ui/components/popover";
import { Clock } from "lucide-react";
import { useState } from "react";

const TIME_PATTERN = /^(0?[1-9]|1[0-2]):[0-5][0-9]$/;
const HOURS_PER_PERIOD = 12;
const MINUTES_PER_HOUR = 60;
const PICKER_STEP_MINUTES = 15;
const TIME_OPTIONS = Array.from({ length: (HOURS_PER_PERIOD * MINUTES_PER_HOUR) / PICKER_STEP_MINUTES }, (_, index) => {
  const minutes = index * PICKER_STEP_MINUTES;
  return `${Math.floor(minutes / MINUTES_PER_HOUR) || HOURS_PER_PERIOD}:${String(minutes % MINUTES_PER_HOUR).padStart(2, "0")}`;
});

export function ShiftTimePicker({ id, name, label, onChange }: { id: string; name: string; label: string; onChange: () => void }) {
  const [time, setTime] = useState("");
  const [period, setPeriod] = useState<"AM" | "PM">("AM");
  const [open, setOpen] = useState(false);
  const [hours = "", minutes = ""] = time.split(":");
  const valid = TIME_PATTERN.test(time);
  const value = valid
    ? `${String((Number(hours) % HOURS_PER_PERIOD) + (period === "PM" ? HOURS_PER_PERIOD : 0)).padStart(2, "0")}:${minutes}`
    : "";

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <input type="hidden" name={name} value={value} />
      <div className="flex items-center gap-1">
        <Input
          id={id}
          className="min-w-0 flex-1"
          value={time}
          placeholder="h:mm"
          pattern="(0?[1-9]|1[0-2]):[0-5][0-9]"
          title="Enter a time such as 9:30 or 12:00, then choose AM or PM."
          aria-describedby={`${id}-help`}
          required
          onChange={(event) => {
            setTime(event.target.value);
            onChange();
          }}
          onBlur={() => {
            if (valid) setTime(`${Number(hours)}:${minutes}`);
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="icon" aria-label={`Choose ${label.toLowerCase()} time`}>
              <Clock aria-hidden="true" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-44 p-2">
            <p className="px-2 py-1 font-medium text-sm">Choose time ({period})</p>
            <div className="max-h-56 overflow-y-auto overscroll-contain">
              {TIME_OPTIONS.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={valid && `${Number(hours)}:${minutes}` === option ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    setTime(option);
                    setOpen(false);
                    onChange();
                  }}
                >
                  {option} {period}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <fieldset className="flex rounded-md border p-0.5" aria-label={`${label} AM or PM`}>
          {(["AM", "PM"] as const).map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              className="px-2"
              variant={period === option ? "secondary" : "ghost"}
              aria-pressed={period === option}
              onClick={() => {
                setPeriod(option);
                onChange();
              }}
            >
              {option}
            </Button>
          ))}
        </fieldset>
      </div>
      <p id={`${id}-help`} className="text-muted-foreground text-xs">
        Type a time or scroll through the clock menu.
      </p>
    </div>
  );
}
