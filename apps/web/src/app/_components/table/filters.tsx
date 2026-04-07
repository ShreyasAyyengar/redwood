"use client";

import type { classroomSchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { Label } from "@redwood/shad-ui/components/label";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@redwood/shad-ui/components/select";
import { Separator } from "@redwood/shad-ui/components/separator";
import { Switch } from "@redwood/shad-ui/components/switch";
import { cn } from "@redwood/shad-ui/lib/utils";
import { motion } from "framer-motion";
import { CalendarClock, Clock, Info, LayoutGrid, ListFilter, RotateCcw, SquareCheckBig, TriangleAlert } from "lucide-react";
import type { z } from "zod";
import { useFetchedRoomsStore } from "../room-store";
import { useActiveFiltersStore } from "./active-filters";

export default function Filters() {
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

  const { fetchedRooms } = useFetchedRoomsStore();
  const groups = Array.from(new Set(fetchedRooms.map((r) => r.groupKey).filter(Boolean) as string[])).sort();

  const resetFilters = () => {
    setExclusive(false);
    setStatus(undefined);
    setHasIssues(false);
    setIncompleteTasks(false);
    setOverdueTasks(false);
    setAvailableNow(false);
    setGroup(undefined);
  };

  const activeCount = [status !== undefined, hasIssues, incompleteTasks, overdueTasks, availableNow, group !== undefined].filter(Boolean).length;

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex h-full w-72 shrink-0 flex-col gap-6 overflow-hidden rounded-xl rounded-r-none bg-neutral-900 p-6 shadow-2xl"
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
          className={cn("text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white", activeCount > 0 && "bg-red-900/60")}
        >
          <RotateCcw className="size-4" />
        </Button>
      </div>

      <Separator className="bg-white/5" />

      <ScrollArea className="-mr-4 flex-1 pr-4">
        <div className="flex flex-col gap-5">
          {/* Categorization */}
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 px-1">
                <LayoutGrid className="size-3.5 text-neutral-500" />
                <h3 className="font-bold text-[10px] text-neutral-600 uppercase tracking-[0.2em]">Room Groups</h3>
              </div>
              <Select value={group || "ALL"} onValueChange={(val) => setGroup(val === "ALL" ? undefined : val)}>
                <SelectTrigger className="h-10 w-full border-white/5 bg-neutral-800/40 shadow-sm transition-colors hover:bg-neutral-800/60">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-neutral-900 text-neutral-200">
                  <SelectItem value="ALL">All</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
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
                <SelectTrigger className="h-10 w-full border-white/5 bg-neutral-800/40 shadow-sm transition-colors hover:bg-neutral-800/60">
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

          {/* Quick Filters */}
          <div className="flex flex-col gap-4">
            <h3 className="px-1 font-bold text-[10px] text-neutral-600 uppercase tracking-[0.2em]">Conditions</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg p-1 px-2 transition-colors hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <CalendarClock className="size-4 text-blue-400/80" />
                  <Label htmlFor="available-now" className="cursor-pointer text-neutral-300 text-sm">
                    Available Now
                  </Label>
                </div>
                <Switch id="available-now" checked={availableNow} onCheckedChange={setAvailableNow} />
              </div>

              <div className="flex items-center justify-between rounded-lg p-1 px-2 transition-colors hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <TriangleAlert className="size-4 text-amber-400/80" />
                  <Label htmlFor="has-issues" className="cursor-pointer text-neutral-300 text-sm">
                    Has Issues
                  </Label>
                </div>
                <Switch id="has-issues" checked={hasIssues} onCheckedChange={setHasIssues} />
              </div>

              <div className="flex items-center justify-between rounded-lg p-1 px-2 transition-colors hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <SquareCheckBig className="size-4 text-emerald-400/80" />
                  <Label htmlFor="incomplete-tasks" className="cursor-pointer text-neutral-300 text-sm">
                    Open Tasks
                  </Label>
                </div>
                <Switch id="incomplete-tasks" checked={incompleteTasks} onCheckedChange={setIncompleteTasks} />
              </div>

              <div className="flex items-center justify-between rounded-lg p-1 px-2 transition-colors hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <Clock className="size-4 text-rose-400/80" />
                  <Label htmlFor="overdue-tasks" className="cursor-pointer text-neutral-300 text-sm">
                    Overdue Tasks
                  </Label>
                </div>
                <Switch id="overdue-tasks" checked={overdueTasks} onCheckedChange={setOverdueTasks} />
              </div>
            </div>
          </div>

          <Separator className="m-0 bg-white/5" />

          {/* Logic Toggle */}
          <div className="flex flex-col gap-3 rounded-lg border bg-neutral-800/20 p-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="exclusive" className="cursor-pointer font-medium text-neutral-300 text-sm">
                Exclusive {exclusive ? "(AND)" : "(OR)"}
              </Label>
              <Switch id="exclusive" checked={exclusive} onCheckedChange={setExclusive} />
            </div>
            <p className="text-[10px] text-neutral-500 italic">
              {exclusive ? "Rooms must match ALL active filters" : "Rooms matching ANY active filter will show"}
            </p>
          </div>
        </div>
      </ScrollArea>
    </motion.aside>
  );
}
