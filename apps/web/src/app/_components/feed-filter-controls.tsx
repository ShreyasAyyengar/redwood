"use client";

import { Badge } from "@redwood/shad-ui/components/badge";
import { Button } from "@redwood/shad-ui/components/button";
import { Calendar } from "@redwood/shad-ui/components/calendar";
import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { Input } from "@redwood/shad-ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@redwood/shad-ui/components/popover";
import { cn } from "@redwood/shad-ui/lib/utils";
import { CalendarDays, CheckCircle2, Filter, RotateCcw, Search, ShieldAlert, X } from "lucide-react";
import type React from "react";

type DateRange = {
  from: Date | undefined;
  to?: Date;
};

export type TaskFeedFilterValue = {
  completed?: DateRange;
  created?: DateRange;
  hasDueDate?: boolean;
  search?: string;
  supervisorNeeded?: boolean;
  urgent?: boolean;
};

export type IssueFeedFilterValue = {
  created?: DateRange;
  hasCruzfixId?: boolean;
  hasFindings?: boolean;
  hasSodId?: boolean;
  resolved?: DateRange;
  search?: string;
  supervisorNeeded?: boolean;
  urgent?: boolean;
};

type FeedFilterControlsProps =
  | {
      kind: "tasks";
      onChange: (value: TaskFeedFilterValue) => void;
      value: TaskFeedFilterValue;
    }
  | {
      kind: "issues";
      onChange: (value: IssueFeedFilterValue) => void;
      value: IssueFeedFilterValue;
    };

type ActiveFilter = {
  key: string;
  label: string;
  remove: () => void;
};

export function FeedFilterControls(props: FeedFilterControlsProps) {
  const activeFilters = getActiveFilters(props);
  const activeCount = activeFilters.length;
  const searchPlaceholder = props.kind === "tasks" ? "Search task or completion text..." : "Search issue or resolution text...";

  const setSearch = (search: string) => {
    props.onChange({
      ...props.value,
      search: search || undefined,
    } as never);
  };

  const resetFilters = () => props.onChange({} as never);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3 px-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-500" />
          <Input
            value={props.value.search ?? ""}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 border-white/5 bg-neutral-900/60 pr-3 pl-9 text-neutral-200 placeholder:text-neutral-500 hover:bg-neutral-900/80"
          />
        </div>

        <div className="flex shrink-0 gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-10 border-white/5 bg-neutral-900/60 text-neutral-200 hover:bg-neutral-900/80",
                  activeCount > 0 && "border-emerald-400/30 bg-emerald-950/20 text-emerald-100"
                )}
              >
                <Filter className="size-4" />
                Filters
                {activeCount > 0 && (
                  <span className="rounded-full bg-emerald-400/15 px-1.5 py-0.5 font-semibold text-[10px] text-emerald-100">{activeCount}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[min(92vw,42rem)] border-white/10 bg-neutral-950 p-4 text-neutral-200">
              <div className="grid gap-5 md:grid-cols-[1.25fr_1fr]">
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
                  <DateRangePicker
                    icon={<CalendarDays className="size-3.5 text-neutral-500" />}
                    label="Created"
                    value={props.value.created}
                    onChange={(created) => props.onChange({ ...props.value, created } as never)}
                  />
                  <DateRangePicker
                    icon={<CheckCircle2 className="size-3.5 text-neutral-500" />}
                    label={props.kind === "tasks" ? "Completed" : "Resolved"}
                    value={props.kind === "tasks" ? props.value.completed : props.value.resolved}
                    onChange={(range) =>
                      props.kind === "tasks"
                        ? props.onChange({ ...props.value, completed: range } as never)
                        : props.onChange({ ...props.value, resolved: range } as never)
                    }
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 px-1">
                    <ShieldAlert className="size-3.5 text-neutral-500" />
                    <span className="font-bold text-[10px] text-neutral-500 uppercase tracking-[0.2em]">Flags</span>
                  </div>
                  <div className="grid gap-2">
                    <CheckboxOption
                      checked={Boolean(props.value.urgent)}
                      label="Urgent"
                      onChange={(urgent) => props.onChange({ ...props.value, urgent })}
                    />
                    <CheckboxOption
                      checked={Boolean(props.value.supervisorNeeded)}
                      label="Needs supervisor"
                      onChange={(supervisorNeeded) => props.onChange({ ...props.value, supervisorNeeded })}
                    />
                    {props.kind === "tasks" ? (
                      <CheckboxOption
                        checked={Boolean(props.value.hasDueDate)}
                        label="Has due date"
                        onChange={(hasDueDate) => props.onChange({ ...props.value, hasDueDate })}
                      />
                    ) : (
                      <>
                        <CheckboxOption
                          checked={Boolean(props.value.hasSodId)}
                          label="Has SOD"
                          onChange={(hasSodId) => props.onChange({ ...props.value, hasSodId })}
                        />
                        <CheckboxOption
                          checked={Boolean(props.value.hasCruzfixId)}
                          label="Has CruzFix"
                          onChange={(hasCruzfixId) => props.onChange({ ...props.value, hasCruzfixId })}
                        />
                        <CheckboxOption
                          checked={Boolean(props.value.hasFindings)}
                          label="Has findings"
                          onChange={(hasFindings) => props.onChange({ ...props.value, hasFindings })}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={activeCount === 0}
            onClick={resetFilters}
            title="Reset filters"
            className="h-10 w-10 text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-100 disabled:opacity-40"
          >
            <RotateCcw className="size-4" />
          </Button>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <Badge key={filter.key} variant="outline" className="border-emerald-400/25 bg-emerald-950/20 py-1 pr-1 pl-2 text-emerald-100">
              <span>{filter.label}</span>
              <button
                type="button"
                onClick={filter.remove}
                className="inline-flex size-4 items-center justify-center rounded-full text-emerald-100/70 transition-colors hover:bg-emerald-400/15 hover:text-emerald-50"
                title={`Remove ${filter.label}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function DateRangePicker({
  icon,
  label,
  onChange,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  onChange: (value: DateRange | undefined) => void;
  value: DateRange | undefined;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        {icon}
        <span className="font-bold text-[10px] text-neutral-500 uppercase tracking-[0.2em]">{label}</span>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="h-10 justify-start border-white/5 bg-neutral-900/60 text-left font-normal text-neutral-200 hover:bg-neutral-900/80"
          >
            <CalendarDays className="size-4 text-neutral-500" />
            <span className="truncate">{formatRange(value) ?? `Any ${label.toLowerCase()} date`}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto border-white/10 bg-neutral-950 p-0 text-neutral-200">
          <Calendar mode="range" selected={value} onSelect={onChange} numberOfMonths={2} defaultMonth={value?.from} />
          <div className="flex justify-end border-white/10 border-t p-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(undefined)} className="text-neutral-300">
              Clear
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function CheckboxOption({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  const id = `feed-filter-${label.toLowerCase().replaceAll(" ", "-")}`;

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-neutral-300 text-sm transition-colors hover:bg-white/5"
    >
      <Checkbox id={id} checked={checked} onCheckedChange={(next) => onChange(next === true)} className="border-neutral-600" />
      <span>{label}</span>
    </label>
  );
}

function getActiveFilters(props: FeedFilterControlsProps): ActiveFilter[] {
  const filters: ActiveFilter[] = [];
  const setValue = (next: TaskFeedFilterValue | IssueFeedFilterValue) => props.onChange(next as never);
  const value = props.value;

  if (value.search?.trim()) {
    filters.push({ key: "search", label: `Text: ${value.search.trim()}`, remove: () => setValue({ ...value, search: undefined }) });
  }
  if (value.created?.from || value.created?.to) {
    filters.push({ key: "created", label: `Created: ${formatRange(value.created)}`, remove: () => setValue({ ...value, created: undefined }) });
  }

  filters.push(...(props.kind === "tasks" ? getTaskActiveFilters(props.value, setValue) : getIssueActiveFilters(props.value, setValue)));

  if (value.urgent) filters.push({ key: "urgent", label: "Urgent", remove: () => setValue({ ...value, urgent: false }) });
  if (value.supervisorNeeded) {
    filters.push({ key: "supervisorNeeded", label: "Needs supervisor", remove: () => setValue({ ...value, supervisorNeeded: false }) });
  }

  return filters;
}

function getTaskActiveFilters(value: TaskFeedFilterValue, setValue: (next: TaskFeedFilterValue) => void): ActiveFilter[] {
  const filters: ActiveFilter[] = [];

  if (value.completed?.from || value.completed?.to) {
    filters.push({
      key: "completed",
      label: `Completed: ${formatRange(value.completed)}`,
      remove: () => setValue({ ...value, completed: undefined }),
    });
  }
  if (value.hasDueDate) filters.push({ key: "hasDueDate", label: "Has due date", remove: () => setValue({ ...value, hasDueDate: false }) });

  return filters;
}

function getIssueActiveFilters(value: IssueFeedFilterValue, setValue: (next: IssueFeedFilterValue) => void): ActiveFilter[] {
  const filters: ActiveFilter[] = [];

  if (value.resolved?.from || value.resolved?.to) {
    filters.push({
      key: "resolved",
      label: `Resolved: ${formatRange(value.resolved)}`,
      remove: () => setValue({ ...value, resolved: undefined }),
    });
  }
  if (value.hasSodId) filters.push({ key: "hasSodId", label: "Has SOD", remove: () => setValue({ ...value, hasSodId: false }) });
  if (value.hasCruzfixId) filters.push({ key: "hasCruzfixId", label: "Has CruzFix", remove: () => setValue({ ...value, hasCruzfixId: false }) });
  if (value.hasFindings) filters.push({ key: "hasFindings", label: "Has findings", remove: () => setValue({ ...value, hasFindings: false }) });

  return filters;
}

function formatRange(range: DateRange | undefined) {
  if (!range?.from && !range?.to) return;
  if (range.from && range.to) {
    if (range.from.toDateString() === range.to.toDateString()) return formatDate(range.from);
    return `${formatDate(range.from)} - ${formatDate(range.to)}`;
  }
  if (range.from) return `After ${formatDate(range.from)}`;
  if (range.to) return `Before ${formatDate(range.to)}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}
