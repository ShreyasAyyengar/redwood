import type { classroomSchema } from "@redwood/contracts";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@redwood/shad-ui/components/table";
import { type ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, type Row, useReactTable } from "@tanstack/react-table";
import type { z } from "zod";
import { RoomRow } from "./room-row";

export function RoomTable<TData, TValue>({ data, columns }: { data: TData[]; columns: ColumnDef<TData, TValue>[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableFilters: true,
  });

  const rows = table.getRowModel();

  return (
    // <div className="flex h-full w-2/3 items-center justify-center rounded-lg border border-orange-500">
    <ScrollArea className="flex h-full w-2/3 items-center justify-center rounded-lg bg-background-100 p-5 shadow-xl/50 ring-1 ring-black/5">
      <Table className="border-separate border-spacing-0">
        <TableHeader className="sticky top-0 border">
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

        <TableBody>
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
    // </div>
  );
}
