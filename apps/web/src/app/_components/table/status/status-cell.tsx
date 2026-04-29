import type { classroomSchemaPayload } from "@redwood/contracts";
import type { Row } from "@tanstack/react-table";
import { CircleAlert, ThumbsUp, TriangleAlert } from "lucide-react";
import type { z } from "zod";

export default function StatusCell({ row }: { row: Row<z.infer<typeof classroomSchemaPayload>> }) {
  const room = row.original;
  const roomStatus = room.roomStatus;

  switch (roomStatus) {
    case "NEEDS URGENT ATTENTION":
      return (
        <div className="flex items-center justify-center text-red-500">
          <TriangleAlert className="flex size-6" />
        </div>
      );
    case "NEEDS ATTENTION":
      return (
        <div className="flex items-center justify-center text-yellow-500">
          <CircleAlert className="flex size-6" />
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center text-foreground">
          <ThumbsUp className="flex size-6" />
        </div>
      );
  }
}
