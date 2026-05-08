import type { classroomSchemaPayload } from "@redwood/contracts";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@redwood/shad-ui/components/hover-card";
import { useQuery } from "@tanstack/react-query";
import type { Row } from "@tanstack/react-table";
import { CircleAlert, Plus, ThumbsUp, TriangleAlert } from "lucide-react";
import { useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../../lib/orpc-web-client";
import { MiniIssueCard } from "../../../classroom/[id]/_components/issue/issue-card";
import { IssueDialog } from "../../../classroom/[id]/_components/issue/issue-dialog";

export default function StatusCell({ row }: { row: Row<z.infer<typeof classroomSchemaPayload>> }) {
  const room = row.original;
  const roomStatus = room.roomStatus;
  const [isHoverOpen, setIsHoverOpen] = useState(false);

  const { data: issues, isLoading } = useQuery({
    ...webClientORPC.issues.getActiveIssues.queryOptions({
      input: { classroomId: room._id },
    }),
    enabled: isHoverOpen,
  });

  const hoverCard = (children: React.ReactNode) => (
    <HoverCard open={isHoverOpen} onOpenChange={setIsHoverOpen} openDelay={100} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="top"
        className="flex w-80 flex-col items-stretch gap-2 border-zinc-800 bg-zinc-900 p-3"
        onClick={(e) => {
          e.stopPropagation();
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-center font-bold text-sm text-zinc-100">Issues</span>
          <IssueDialog roomId={room._id}>
            <div className="rounded-md bg-white px-1 text-black transition-all duration-100 active:scale-95 active:transform">
              <Plus className="size-5" />
            </div>
          </IssueDialog>
        </div>

        {isLoading ? (
          <span className="py-2 text-center text-sm text-zinc-500">Loading issues...</span>
        ) : issues && issues.length > 0 ? (
          <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
            {issues.map((issue) => (
              <IssueDialog key={issue._id} roomId={room._id} existingIssue={issue}>
                <MiniIssueCard issue={issue} />
              </IssueDialog>
            ))}
          </div>
        ) : (
          <span className="py-2 text-center text-sm text-zinc-500">No active issues</span>
        )}
      </HoverCardContent>
    </HoverCard>
  );

  const wrapHover = (children: React.ReactNode) => hoverCard(children);

  switch (roomStatus) {
    case "NEEDS URGENT ATTENTION":
      return wrapHover(
        <div className="flex items-center justify-center text-red-500">
          <TriangleAlert className="flex size-6" />
        </div>
      );
    case "NEEDS ATTENTION":
      return wrapHover(
        <div className="flex items-center justify-center text-yellow-500">
          <CircleAlert className="flex size-6" />
        </div>
      );
    default:
      return wrapHover(
        <div className="flex items-center justify-center text-foreground">
          <ThumbsUp className="flex size-6" />
        </div>
      );
  }
}
