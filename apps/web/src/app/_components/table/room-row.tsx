import type { classroomSchemaPayload } from "@redwood/contracts";
import { TableCell, TableRow } from "@redwood/shad-ui/components/table";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { flexRender, type Row } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../lib/orpc-web-client";

const PREFETCH_DELAY_MS = 250;

export function RoomRow({ row }: { row: Row<z.infer<typeof classroomSchemaPayload>> }) {
  const cells = row.getVisibleCells();
  const [isHovering, setIsHovering] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const classroomId = row.original._id;
  const historyQuery = webClientORPC.maintenance.getHistory.queryOptions({
    input: { classroomId },
    staleTime: 60_000,
  });
  const issuesQuery = webClientORPC.issues.getActiveTasks.queryOptions({
    input: { classroomId },
    staleTime: 60_000,
  });
  const tasksQuery = webClientORPC.tasks.getOpenTasks.queryOptions({
    input: { classroomId },
    staleTime: 60_000,
  });
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const prefetchRoomData = () => {
    queryClient.prefetchQuery({
      ...historyQuery,
      staleTime: 60_000,
    });

    queryClient.prefetchQuery({
      ...issuesQuery,
      staleTime: 60_000,
    });

    queryClient.prefetchQuery({
      ...tasksQuery,
      staleTime: 60_000,
    });
  };

  return (
    <>
      <TableRow
        className="transition-all duration-150 hover:-translate-y-0.5 hover:cursor-pointer hover:bg-zinc-800 hover:shadow-xl/70 active:scale-95 active:transform"
        onMouseEnter={() => {
          setIsHovering(true);
          hoverTimeoutRef.current = setTimeout(() => {
            prefetchRoomData();
          }, PREFETCH_DELAY_MS);
        }}
        onMouseLeave={() => {
          setIsHovering(false);

          if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
          }
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
