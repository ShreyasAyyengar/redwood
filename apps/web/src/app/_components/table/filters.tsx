"use client";

import type { classroomSchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { Label } from "@redwood/shad-ui/components/label";
import { Popover, PopoverContent, PopoverTrigger } from "@redwood/shad-ui/components/popover";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@redwood/shad-ui/components/select";
import { Separator } from "@redwood/shad-ui/components/separator";
import { Switch } from "@redwood/shad-ui/components/switch";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarClock, Clock, Info, LayoutGrid, ListFilter, RotateCcw, SquareCheckBig, TriangleAlert } from "lucide-react";
import { useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../lib/orpc-web-client";
import { getActiveFilterCount, useActiveFiltersStore } from "./active-filters";

function useFiltersController() {
  const {
    exclusive,
    status,
    hasIssues,
    incompleteTasks,
    overdueTasks,
    availableNow,
    group,
    setExclusive,
    setStatus,
    setHasIssues,
    setIncompleteTasks,
    setOverdueTasks,
    setAvailableNow,
    setGroup,
  } = useActiveFiltersStore();

  const { data: groups } = useQuery(webClientORPC.groups.getGroups.queryOptions());

  const resetFilters = () => {
    setExclusive(false);
    setStatus(undefined);
    setHasIssues(false);
    setIncompleteTasks(false);
    setOverdueTasks(false);
    setAvailableNow(false);
    setGroup(undefined);
  };

  const activeCount = getActiveFilterCount({ exclusive, status, hasIssues, incompleteTasks, overdueTasks, availableNow, group });

  return {
    exclusive,
    status,
    hasIssues,
    incompleteTasks,
    overdueTasks,
    availableNow,
    group,
    groups,
    setExclusive,
    setStatus,
    setHasIssues,
    setIncompleteTasks,
    setOverdueTasks,
    setAvailableNow,
    setGroup,
    resetFilters,
    activeCount,
  };
}

type FiltersController = ReturnType<typeof useFiltersController>;

function FilterControls({ controller, idPrefix, compact = false }: { controller: FiltersController; idPrefix: string; compact?: boolean }) {
  const {
    exclusive,
    status,
    hasIssues,
    incompleteTasks,
    overdueTasks,
    availableNow,
    group,
    groups,
    setExclusive,
    setStatus,
    setHasIssues,
    setIncompleteTasks,
    setOverdueTasks,
    setAvailableNow,
    setGroup,
  } = controller;

  const sortedGroups = groups ? [...groups].sort((a, b) => a.label.localeCompare(b.label)) : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 px-1">
            <LayoutGrid className="size-3.5 text-neutral-500" />
            <h3 className="font-bold text-[10px] text-neutral-600 uppercase tracking-[0.2em]">Room Groups</h3>
          </div>
          <Select value={group || "ALL"} onValueChange={(val) => setGroup(val === "ALL" ? undefined : val)}>
            <SelectTrigger
              className={cn(
                "h-10 w-full min-w-0 border-white/5 bg-neutral-800/40 shadow-sm transition-colors hover:bg-neutral-800/60 [&>span]:min-w-0 [&>span]:truncate",
                compact ? "max-w-none" : "max-w-[11rem]"
              )}
            >
              <SelectValue placeholder="All Groups" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-neutral-900 text-neutral-200">
              <SelectItem value="ALL">All</SelectItem>
              {sortedGroups.map((g) => (
                <SelectItem key={g._id} value={g.label}>
                  {g.label}
                </SelectItem>
              ))}
              <SelectItem value="Ungrouped">Ungrouped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2 px-1">
            <Info className="size-3.5 text-neutral-500" />
            <h3 className="font-bold text-[10px] text-neutral-600 uppercase tracking-[0.2em]">Room Status</h3>
          </div>
          <Select
            value={status || "ALL"}
            onValueChange={(val) => setStatus(val === "ALL" ? undefined : (val as z.infer<typeof classroomSchema>["roomStatus"]))}
          >
            <SelectTrigger
              className={cn(
                "h-10 w-full min-w-0 border-white/5 bg-neutral-800/40 shadow-sm transition-colors hover:bg-neutral-800/60 [&>span]:min-w-0 [&>span]:truncate",
                compact ? "max-w-none" : "max-w-[11rem]"
              )}
            >
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-neutral-900 text-neutral-200">
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="GOOD">Good</SelectItem>
              <SelectItem value="NEEDS ATTENTION">Needs Attention</SelectItem>
              <SelectItem value="NEEDS URGENT ATTENTION">Needs Urgent Attention</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="bg-white/5" />

      <div className="flex flex-col gap-4">
        <h3 className="px-1 font-bold text-[10px] text-neutral-600 uppercase tracking-[0.2em]">Conditions</h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg p-1 px-2 transition-colors hover:bg-white/5">
            <div className="flex items-center gap-3">
              <CalendarClock className="size-4 text-blue-400/80" />
              <Label htmlFor={`${idPrefix}-available-now`} className="cursor-pointer text-neutral-300 text-sm">
                Available Now
              </Label>
            </div>
            <Switch id={`${idPrefix}-available-now`} checked={availableNow} onCheckedChange={setAvailableNow} />
          </div>

          <div className="flex items-center justify-between rounded-lg p-1 px-2 transition-colors hover:bg-white/5">
            <div className="flex items-center gap-3">
              <TriangleAlert className="size-4 text-amber-400/80" />
              <Label htmlFor={`${idPrefix}-has-issues`} className="cursor-pointer text-neutral-300 text-sm">
                Has Issues
              </Label>
            </div>
            <Switch id={`${idPrefix}-has-issues`} checked={hasIssues} onCheckedChange={setHasIssues} />
          </div>

          <div className="flex items-center justify-between rounded-lg p-1 px-2 transition-colors hover:bg-white/5">
            <div className="flex items-center gap-3">
              <SquareCheckBig className="size-4 text-emerald-400/80" />
              <Label htmlFor={`${idPrefix}-incomplete-tasks`} className="cursor-pointer text-neutral-300 text-sm">
                Open Tasks
              </Label>
            </div>
            <Switch id={`${idPrefix}-incomplete-tasks`} checked={incompleteTasks} onCheckedChange={setIncompleteTasks} />
          </div>

          <div className="flex items-center justify-between rounded-lg p-1 px-2 transition-colors hover:bg-white/5">
            <div className="flex items-center gap-3">
              <Clock className="size-4 text-rose-400/80" />
              <Label htmlFor={`${idPrefix}-overdue-tasks`} className="cursor-pointer text-neutral-300 text-sm">
                Overdue Tasks
              </Label>
            </div>
            <Switch id={`${idPrefix}-overdue-tasks`} checked={overdueTasks} onCheckedChange={setOverdueTasks} />
          </div>
        </div>
      </div>

      <Separator className="m-0 bg-white/5" />

      <div className="flex flex-col gap-3 rounded-lg border bg-neutral-800/20 p-3">
        <div className="flex items-center justify-between">
          <Label htmlFor={`${idPrefix}-exclusive`} className="cursor-pointer font-medium text-neutral-300 text-sm">
            {exclusive ? "Exclusive (AND)" : "Inclusive (OR)"}
          </Label>
          <Switch id={`${idPrefix}-exclusive`} checked={exclusive} onCheckedChange={setExclusive} />
        </div>
        <p className="text-[10px] text-neutral-500 italic">
          {exclusive ? "Rooms must match ALL active filters" : "Rooms matching ANY active filter will show"}
        </p>
      </div>
    </div>
  );
}

export default function Filters() {
  const controller = useFiltersController();
  const { activeCount, resetFilters } = controller;

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex h-full w-60 shrink-0 flex-col gap-6 overflow-hidden rounded-xl rounded-r-none bg-neutral-900 p-6 shadow-2xl"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg rounded-r-none bg-neutral-800 shadow-inner ring-1 ring-white/5">
            <ListFilter className="size-5 text-neutral-300" />
          </div>
          <div className="flex flex-col">
            <h2 className="font-bold text-lg text-white leading-none tracking-tight">Filters</h2>
            {activeCount > 0 ? (
              <span className="mt-1 font-semibold text-[10px] text-emerald-400 uppercase tracking-wider">{activeCount} active</span>
            ) : (
              <span className="mt-1 font-semibold text-[10px] text-neutral-500 uppercase tracking-wider">Default View</span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={resetFilters}
          aria-label="Reset filters"
          className={cn("text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white", activeCount > 0 && "bg-red-900/60")}
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <Separator className="bg-white/5" />

      <ScrollArea className="-mr-4 flex-1 pr-4">
        <FilterControls controller={controller} idPrefix="desktop-filters" />
      </ScrollArea>
    </motion.aside>
  );
}

export function CompactFilters() {
  const controller = useFiltersController();
  const { activeCount, resetFilters } = controller;
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-10 border-white/10 bg-neutral-900 px-3 text-neutral-100 shadow-lg hover:bg-neutral-800 hover:text-white"
        >
          <ListFilter className="size-4" />
          <span>Filters</span>
          {activeCount > 0 && (
            <span className="ml-0.5 rounded-full bg-emerald-500 px-1.5 font-bold text-[10px] text-neutral-950 leading-5">{activeCount}</span>
          )}
        </Button>
      </PopoverTrigger>
      {open && (
        <button
          type="button"
          aria-label="Close filters"
          className="fixed inset-0 z-40 cursor-default bg-transparent p-0"
          onClick={() => setOpen(false)}
        />
      )}
      <PopoverContent
        align="end"
        sideOffset={10}
        className="max-h-[calc(100vh-7rem)] w-[calc(100vw-2rem)] max-w-sm overflow-hidden border-white/10 bg-neutral-950 p-0 text-white shadow-2xl"
      >
        <div className="flex max-h-[calc(100vh-7rem)] flex-col">
          <div className="flex shrink-0 items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-neutral-800 shadow-inner ring-1 ring-white/5">
                <ListFilter className="size-5 text-neutral-300" />
              </div>
              <div className="flex flex-col">
                <h2 className="font-bold text-lg text-white leading-none tracking-tight">Filters</h2>
                {activeCount > 0 ? (
                  <span className="mt-1 font-semibold text-[10px] text-emerald-400 uppercase tracking-wider">{activeCount} active</span>
                ) : (
                  <span className="mt-1 font-semibold text-[10px] text-neutral-500 uppercase tracking-wider">Default View</span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={resetFilters}
              aria-label="Reset filters"
              className={cn("text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white", activeCount > 0 && "bg-red-900/60")}
            >
              <RotateCcw className="size-4" />
            </Button>
          </div>

          <Separator className="bg-white/5" />

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-5">
            <FilterControls controller={controller} idPrefix="mobile-filters" compact />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
