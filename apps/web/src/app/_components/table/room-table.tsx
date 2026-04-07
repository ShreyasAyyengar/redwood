"use client";

import type { classroomSchema } from "@redwood/contracts";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@redwood/shad-ui/components/table";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type Row,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { useShallow } from "zustand/react/shallow";
import { dayAvailability, getBlocksForToday, getCaliClock } from "../../../util/date-time-utils";
import { useActiveFiltersStore } from "./active-filters";
import { RoomRow } from "./room-row";

const SORTING_STORAGE_KEY = "room-table-sorting";

export function RoomTable({
  data,
  columns,
}: {
  data: z.infer<typeof classroomSchema>[];
  columns: ColumnDef<z.infer<typeof classroomSchema>>[];
}) {
  const [sorting, setSorting] = useState<SortingState>(() => {
    const stored = localStorage.getItem(SORTING_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    return [];
  });

  useEffect(() => {
    localStorage.setItem(SORTING_STORAGE_KEY, JSON.stringify(sorting));
  }, [sorting]);

  const filterState = useActiveFiltersStore(
    useShallow((s) => ({
      exclusive: s.exclusive,
      status: s.status,
      hasIssues: s.hasIssues,
      incompleteTasks: s.incompleteTasks,
      overdueTasks: s.overdueTasks,
      availableNow: s.availableNow,
      group: s.group,
    }))
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableFilters: true,
    state: {
      sorting,
      globalFilter: filterState,
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const { exclusive, status, hasIssues, incompleteTasks, overdueTasks, availableNow, group } = filterState;

      const room = row.original;

      // hard constraint: if group is selected, room must be in that group
      if (group && room.groupKey !== group) return false;

      const checks: boolean[] = [];

      if (status) checks.push(room.roomStatus === status);

      if (hasIssues) checks.push(room.roomStatus !== "GOOD");

      if (incompleteTasks) checks.push(room.openTasksCount > 0);

      if (overdueTasks) checks.push(false); // replace with real logic

      if (availableNow) {
        if (!room.schedule) {
          checks.push(false);
        } else {
          const { weekdayKey, nowMin } = getCaliClock();
          const blocks = getBlocksForToday(room.schedule, weekdayKey);
          const availability = dayAvailability(blocks, nowMin);
          checks.push(availability.kind === "open");
        }
      }

      // if no non-group filters are active, and group matched, allow it
      if (checks.length === 0) return true;

      return exclusive
        ? checks.every(Boolean) // AND across remaining filters
        : checks.some(Boolean); // OR across remaining filters
    },
    onSortingChange: setSorting,
  });

  const rows = table.getRowModel();

  return (
    <ScrollArea className="flex h-full w-fit items-center justify-center rounded-lg rounded-l-none bg-neutral-900 p-5 shadow-xl/50 ring-1 ring-black/5">
      <Table className="border-separate border-spacing-0">
        <TableHeader className="sticky top-0 z-1 border">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="backdrop-blur-2xl">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className="p-3">
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="mt-4">
          <TableRow className="h-2">
            <TableCell colSpan={columns.length} className="border-0 p-0" />
          </TableRow>
          {rows.rows.length > 0 ? (
            rows.rows.map((row) => <RoomRow key={row.id} row={row as Row<z.infer<typeof classroomSchema>>} />)
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
