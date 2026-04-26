import type { classroomSchemaPayload } from "@redwood/contracts";
import { cn } from "@redwood/shad-ui/lib/utils";
import type { Row } from "@tanstack/react-table";
import type { z } from "zod";

export default function OpenTasksCell({ row }: { row: Row<z.infer<typeof classroomSchemaPayload>> }) {
  const openTasksCount = row.original.openTasksCount;

  return (
    <div className={cn("flex items-center justify-center text-lg", row.original.roomStatus === "GOOD" && "text-foreground")}>
      {openTasksCount}
    </div>
  );
}
