"use client";

import type { classroomSchema } from "@redwood/contracts";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@redwood/shad-ui/components/table";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type Row,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { RoomRow } from "./room-row";

const SORTING_STORAGE_KEY = "room-table-sorting";

export function RoomTable<TData, TValue>({ data, columns }: { data: TData[]; columns: ColumnDef<TData, TValue>[] }) {
  const [sorting, setSorting] = useState<SortingState>(() => {
    const stored = localStorage.getItem(SORTING_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(SORTING_STORAGE_KEY, JSON.stringify(sorting));
  }, [sorting]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableFilters: true,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  const rows = table.getRowModel();

  return (
    <ScrollArea className="flex h-full w-fit items-center justify-center rounded-lg bg-neutral-900 p-5 shadow-xl/50 ring-1 ring-black/5">
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
