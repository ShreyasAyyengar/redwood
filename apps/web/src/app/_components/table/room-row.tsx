import type { classroomSchema } from "@redwood/contracts";
import { TableCell, TableRow } from "@redwood/shad-ui/components/table";
import { cn } from "@redwood/shad-ui/lib/utils";
import { flexRender, type Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { z } from "zod";

export function RoomRow({ row }: { row: Row<z.infer<typeof classroomSchema>> }) {
  const cells = row.getVisibleCells();
  const [isHovering, setIsHovering] = useState(false);
  const router = useRouter();

  const handleRowClick = () => {
    router.push(`/classroom/${row.original._id}`);
  };

  return (
    <>
      <TableRow
        className="transition-all duration-150 hover:-translate-y-0.5 hover:cursor-pointer hover:bg-zinc-800 hover:shadow-xl/70"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleRowClick}
      >
        {cells.map((cell, index) => (
          <TableCell
            className={cn(
              "border-y bg-background-100/50 px-5 py-3",
              index === 0 && "rounded-l-xl border border-r-0",
              index === cells.length - 1 && "rounded-r-xl border border-l-0",
              isHovering && "border-white/10"
            )}
            key={cell.id}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
      <tr className="h-3" />
    </>
  );
}
