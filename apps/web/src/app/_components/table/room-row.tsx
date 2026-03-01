import type { classroomSchema } from "@redwood/contracts";
import { TableCell, TableRow } from "@redwood/shad-ui/components/table";
import { cn } from "@redwood/shad-ui/lib/utils";
import { flexRender, type Row } from "@tanstack/react-table";
import type { z } from "zod";

export function RoomRow({ row }: { row: Row<z.infer<typeof classroomSchema>> }) {
  const cells = row.getVisibleCells();

  return (
    <>
      <TableRow className="[&>td]:mb-5">
        {cells.map((cell, index) => (
          <TableCell
            className={cn(
              "border-y bg-background-100/50 px-5 py-3",
              index === 0 && "rounded-l-xl border border-r-0",
              index === cells.length - 1 && "rounded-r-xl border border-l-0"
            )}
            key={cell.id}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
      <tr className="h-5" />
    </>
  );
}
