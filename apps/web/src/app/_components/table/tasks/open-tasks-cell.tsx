import type { classroomSchema } from "@redwood/contracts";
import { cn } from "@redwood/shad-ui/lib/utils";
import type { Row } from "@tanstack/react-table";
import type { z } from "zod";

export default function OpenTasksCell({ row }: { row: Row<z.infer<typeof classroomSchema>> }) {
  const openTasksCount = row.original.openTasksCount;

  return (
    <div
      className={cn(
        "flex items-center justify-center text-lg",
        row.original.roomStatus === "NEEDS URGENT ATTENTION" && "text-red-500",
        row.original.roomStatus === "NEEDS ATTENTION" && "text-yellow-500",
        row.original.roomStatus === "GOOD" && "text-foreground"
      )}
    >
      {openTasksCount}
    </div>
  );
}
