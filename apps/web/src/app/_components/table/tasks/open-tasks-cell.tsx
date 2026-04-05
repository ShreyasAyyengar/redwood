import type { classroomSchema } from "@redwood/contracts";
import { cn } from "@redwood/shad-ui/lib/utils";
import type { Row } from "@tanstack/react-table";
import type { z } from "zod";

export default function OpenTasksCell({ row }: { row: Row<z.infer<typeof classroomSchema>> }) {
  const openTasksCount = row.original.openTasksCount; // TODO find a way to make this 'open tasks'

  return (
    <div className={cn("flex items-center justify-center text-lg", row.original.roomStatus === "GOOD" && "text-foreground")}>
      {openTasksCount}
    </div>
  );
}
