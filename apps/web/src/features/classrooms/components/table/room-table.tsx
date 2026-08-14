"use client";

import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@redwood/shad-ui/components/table";
import { flexRender, type SortingState } from "@tanstack/react-table";
import {
  type LegacyColumnDef as ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useLegacyTable as useReactTable,
} from "@tanstack/react-table/legacy";
import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { roomMatchesActiveFilters, useActiveFiltersStore } from "../../model/active-filters";
import type { ClassroomSummary } from "../../model/classroom-types";
import { RoomRow } from "./room-row";

const SORTING_STORAGE_KEY = "room-table-sorting";

export function RoomTable({ data, columns }: { data: ClassroomSummary[]; columns: ColumnDef<ClassroomSummary>[] }) {
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
    globalFilterFn: (row) => roomMatchesActiveFilters(row.original, filterState),
    onSortingChange: setSorting,
  });

  const rows = table.getRowModel();

  return (
    // <ScrollArea className="h-full min-w-0 flex-1 rounded-lg rounded-l-none bg-neutral-900 p-5 shadow-xl/50 ring-1 ring-black/5 [&_[data-slot=scroll-area-viewport]]:rounded-none">
    //   <Table className="mx-auto w-max border-separate border-spacing-0">
    <ScrollArea className="flex h-full w-fit items-center justify-center rounded-lg rounded-l-none bg-neutral-900 p-5 shadow-xl/50 ring-1 ring-black/5 [&_[data-slot=scroll-area-viewport]]:rounded-none">
      <Table className="border-separate border-spacing-0">
        <TableHeader className="sticky top-0 z-1 border">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="backdrop-blur-3xl">
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
            rows.rows.map((row) => <RoomRow key={row.id} row={row} />)
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
