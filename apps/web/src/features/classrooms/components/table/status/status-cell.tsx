import { Button } from "@redwood/shad-ui/components/button";
import { cn } from "@redwood/shad-ui/lib/utils";
import type { LegacyRow as Row } from "@tanstack/react-table/legacy";
import { CircleAlert, ThumbsUp, TriangleAlert } from "lucide-react";
import { ClassroomIssuesPopover } from "#/features/issues/components/classroom-issues-popover.tsx";
import type { ClassroomSummary } from "../../../model/classroom-types";

export default function StatusCell({ row }: { row: Row<ClassroomSummary> }) {
  const room = row.original;
  const statusConfig = {
    "NEEDS URGENT ATTENTION": {
      icon: TriangleAlert,
      className: "text-red-500 hover:bg-red-500/10",
    },
    "NEEDS ATTENTION": {
      icon: CircleAlert,
      className: "text-yellow-500 hover:bg-yellow-500/10",
    },
    GOOD: {
      icon: ThumbsUp,
      className: "",
    },
  } as const;

  const { icon: Icon, className } = statusConfig[room.roomStatus as keyof typeof statusConfig] ?? statusConfig.GOOD;

  return (
    <ClassroomIssuesPopover classroomId={room._id}>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "mx-auto flex size-12 items-center justify-center rounded-lg transition-all duration-150 hover:bg-zinc-900!",
          "active:scale-90 active:transform",
          className
        )}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <Icon className="size-6" />
      </Button>
    </ClassroomIssuesPopover>
  );
}
