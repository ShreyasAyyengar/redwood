"use client";

import { Input } from "@redwood/shad-ui/components/input";
import { Label } from "@redwood/shad-ui/components/label";
import { useEffect, useRef, useState } from "react";

const HOURS_PER_PERIOD = 12;
const MINUTES_PER_HOUR = 60;
const MINUTE_STEP = 15;
const ROW_HEIGHT = 40;
const WHEEL_PADDING = 80;
const HOURS = Array.from({ length: HOURS_PER_PERIOD }, (_, index) => String(index + 1));
const MINUTES = Array.from({ length: MINUTES_PER_HOUR / MINUTE_STEP }, (_, index) => String(index * MINUTE_STEP).padStart(2, "0"));
const PERIODS = ["AM", "PM"];
const MANUAL_TIME_PATTERN = /^(\d{1,4}|\d{1,2}:\d{2})\s*(AM|PM)?$/i;

function parseManualTime(text: string) {
  const match = MANUAL_TIME_PATTERN.exec(text.trim());
  const compact = match?.[1];
  if (!compact) return null;
  const parts = compact.includes(":") ? compact.split(":") : compact.length > 2 ? [compact.slice(0, -2), compact.slice(-2)] : [compact, "00"];
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (hour < 1 || hour > HOURS_PER_PERIOD || minute < 0 || minute >= MINUTES_PER_HOUR || minute % MINUTE_STEP !== 0) return null;
  return { hour: String(hour), minute: String(minute).padStart(2, "0"), period: match?.[2]?.toUpperCase() };
}

type TimeWheelProps = { id: string; label: string; options: string[]; value: string; onChange: (value: string) => void };

function TimeWheel({ id, label, options, value, onChange }: TimeWheelProps) {
  const wheel = useRef<HTMLDivElement>(null);
  const selected = options.indexOf(value);

  useEffect(() => {
    const element = wheel.current;
    if (element && Math.round(element.scrollTop / ROW_HEIGHT) !== selected) element.scrollTop = selected * ROW_HEIGHT;
  }, [selected]);

  function select(index: number) {
    const next = Math.max(0, Math.min(options.length - 1, index));
    wheel.current?.scrollTo({ top: next * ROW_HEIGHT, behavior: "smooth" });
  }

  return (
    <div className="min-w-0 flex-1">
      <p id={`${id}-label`} className="mb-2 text-center text-muted-foreground text-xs">
        {label}
      </p>
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-1 top-20 h-10 rounded-lg bg-muted/70" aria-hidden="true" />
        <div
          ref={wheel}
          role="listbox"
          tabIndex={0}
          aria-labelledby={`${id}-label`}
          aria-activedescendant={`${id}-${selected}`}
          className="relative h-50 snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-lg outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-scrollbar]:hidden"
          style={{ paddingBlock: WHEEL_PADDING }}
          onScroll={(event) => {
            const index = Math.max(0, Math.min(options.length - 1, Math.round(event.currentTarget.scrollTop / ROW_HEIGHT)));
            const next = options[index];
            if (next !== undefined && next !== value) onChange(next);
          }}
          onKeyDown={(event) => {
            const direction = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
            if (direction || event.key === "Home" || event.key === "End") {
              event.preventDefault();
              select(event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : selected + direction);
            }
          }}
        >
          {options.map((option, index) => (
            <button
              key={option}
              id={`${id}-${index}`}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={option === value}
              className={`block h-10 w-full shrink-0 touch-pan-y snap-center text-center tabular-nums transition-[color,font-size] ${option === value ? "font-semibold text-2xl text-foreground" : "text-lg text-muted-foreground/60"}`}
              onClick={() => select(index)}
            >
              {option}
            </button>
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-16 rounded-t-lg bg-gradient-to-b from-card to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-lg bg-gradient-to-t from-card to-transparent"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

export function ShiftTimePicker({ id, name, label, onChange }: { id: string; name: string; label: string; onChange: () => void }) {
  const [hour, setHour] = useState(name === "shiftEnd" ? "5" : "9");
  const [minute, setMinute] = useState("00");
  const [period, setPeriod] = useState(name === "shiftEnd" ? "PM" : "AM");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const display = `${hour}:${minute} ${period}`;
  const value = `${String((Number(hour) % HOURS_PER_PERIOD) + (period === "PM" ? HOURS_PER_PERIOD : 0)).padStart(2, "0")}:${minute}`;

  function wheelChanged() {
    setEditing(false);
    setInvalid(false);
    input.current?.setCustomValidity("");
    onChange();
  }

  return (
    <fieldset className="space-y-2" aria-describedby={`${id}-help`}>
      <legend>
        <Label>{label}</Label>
      </legend>
      <input type="hidden" name={name} value={value} />
      <div className="rounded-xl border bg-card p-3">
        <Label htmlFor={`${id}-manual`} className="sr-only">
          {label} time
        </Label>
        <Input
          ref={input}
          id={`${id}-manual`}
          className="mx-auto mb-3 h-8 w-full cursor-text border-transparent bg-transparent text-center font-medium text-sm tabular-nums shadow-none transition-colors hover:border-border hover:bg-muted/50 dark:bg-transparent dark:hover:bg-muted/50"
          value={editing || invalid ? draft : display}
          required
          autoComplete="off"
          spellCheck={false}
          aria-invalid={invalid}
          aria-describedby={`${id}-help`}
          onFocus={(event) => {
            if (!invalid) setDraft(display);
            setEditing(true);
            event.target.select();
          }}
          onChange={(event) => {
            const text = event.target.value;
            setDraft(text);
            const parsed = parseManualTime(text);
            setInvalid(!parsed);
            event.target.setCustomValidity(parsed ? "" : "Enter a time in 15-minute steps, such as 800, 815, 830, or 845 PM.");
            if (parsed) {
              setHour(parsed.hour);
              setMinute(parsed.minute);
              if (parsed.period) setPeriod(parsed.period);
            }
            onChange();
          }}
          onBlur={() => setEditing(false)}
        />
        <div className="flex gap-2">
          <TimeWheel
            id={`${id}-hour`}
            label="Hour"
            options={HOURS}
            value={hour}
            onChange={(next) => {
              setHour(next);
              wheelChanged();
            }}
          />
          <TimeWheel
            id={`${id}-minute`}
            label="Minute"
            options={MINUTES}
            value={minute}
            onChange={(next) => {
              setMinute(next);
              wheelChanged();
            }}
          />
          <TimeWheel
            id={`${id}-period`}
            label="AM / PM"
            options={PERIODS}
            value={period}
            onChange={(next) => {
              setPeriod(next);
              wheelChanged();
            }}
          />
        </div>
      </div>
      <p id={`${id}-help`} className="text-muted-foreground text-xs">
        Scroll the wheels or type the time above. Try 800 for 8:00 or 800 PM.
      </p>
    </fieldset>
  );
}
