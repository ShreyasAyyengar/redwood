import type { classroomSchema } from "@redwood/contracts";
import type { Row } from "@tanstack/react-table";
import { CircleAlert, ThumbsUp, TriangleAlert } from "lucide-react";
import type { z } from "zod";

export default function StatusCell({ row }: { row: Row<z.infer<typeof classroomSchema>> }) {
  const room = row.original;
  const roomStatus = room.roomStatus;

  switch (roomStatus) {
    case "NEEDS URGENT ATTENTION":
      return (
        <div className="flex items-center justify-center text-red-500">
          <TriangleAlert className="ml-2 flex h-6 w-6" />
        </div>
      );
    case "NEEDS ATTENTION":
      return (
        <div className="flex items-center justify-center text-yellow-500">
          <CircleAlert className="ml-2 flex h-6 w-6" />
        </div>
      );
    default:
      return (
        <div className="flex items-center justify-center text-green-500">
          <ThumbsUp className="ml-2 flex h-6 w-6" />
        </div>
      );
  }
}
