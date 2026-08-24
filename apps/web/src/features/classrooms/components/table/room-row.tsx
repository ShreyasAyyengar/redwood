import { api } from "@backend/convex/_generated/api";
import { TableCell, TableRow } from "@redwood/shad-ui/components/table";
import { cn } from "@redwood/shad-ui/lib/utils";
import { flexRender } from "@tanstack/react-table";
import type { LegacyRow as Row } from "@tanstack/react-table/legacy";
import { useConvex } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ClassroomSummary } from "../../model/classroom-types";

export function RoomRow({ row }: { row: Row<ClassroomSummary> }) {
  const classroomId = row.original._id;
  const cells = row.getVisibleCells();
  const [isHovering, setIsHovering] = useState(false);
  const router = useRouter();

  const convex = useConvex();
  const href = `/classroom/${classroomId}`;

  const prefetchRoom = () => {
    router.prefetch(href);

    convex.prewarmQuery({
      query: api.core.classrooms.service.getRoom,
      args: { id: classroomId },
    });

    convex.prewarmQuery({
      query: api.core.issues.service.getClassroomIssues,
      args: { classroomId },
    });

    convex.prewarmQuery({
      query: api.core.tasks.service.getClassroomTasks,
      args: { classroomId },
    });
  };

  return (
    <>
      <TableRow
        className="transition-all duration-150 hover:-translate-y-0.5 hover:cursor-pointer hover:bg-[#242424] hover:shadow-xl/70 [&:active:not(:has(button:active,a:active,input:active,textarea:active,select:active,[role=button]:active,[data-row-interactive]:active))]:scale-95"
        onMouseEnter={() => {
          setIsHovering(true);
          prefetchRoom();
        }}
        onMouseLeave={() => {
          setIsHovering(false);
        }}
        onClick={() => router.push(`/classroom/${classroomId}`)}
      >
        {cells.map((cell, index) => (
          <TableCell
            key={cell.id}
            className={cn(
              "border-y bg-background-100/50 px-5 py-3",
              index === 0 && "rounded-l-xl border border-r-0",
              index === cells.length - 1 && "rounded-r-xl border border-l-0",
              isHovering && "border-white/10"
            )}
          >
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
      <tr className="h-3" />
    </>
  );
}
