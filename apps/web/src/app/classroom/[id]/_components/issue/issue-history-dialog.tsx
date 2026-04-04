import type { classroomSchema, issueSchema } from "@redwood/contracts";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import type React from "react";
import type { z } from "zod";
import { IssueCard } from "./issue-card";
import { IssueDialog } from "./issue-dialog";

export default function IssueHistoryDialog({
  room,
  issues,
  children,
}: {
  room: z.infer<typeof classroomSchema>;
  issues?: z.infer<typeof issueSchema>[];
  children?: React.ReactNode;
}) {
  if (!issues?.length) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="h-full max-h-[calc(100dvh-300px)] bg-zinc-800 p-3">
        <DialogTitle className="font-semibold text-xl">Issue History: {room.displayName}</DialogTitle>

        {issues && issues.length > 0 && (
          <ScrollArea className="h-full min-h-0 flex-1 overflow-auto rounded-2xl bg-zinc-900 p-3">
            {issues?.map((issue) => (
              <IssueDialog key={issue._id} roomId={room._id} existingIssue={issue}>
                <IssueCard issue={issue} />
              </IssueDialog>
            ))}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
