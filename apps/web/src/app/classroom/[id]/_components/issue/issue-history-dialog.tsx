import type { issueSchema } from "@redwood/contracts";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import type React from "react";
import type { z } from "zod";
import { IssueCard } from "./issue-card";
import { IssueDialog } from "./issue-dialog";

export default function IssueHistoryDialog({
  title,
  issues,
  children,
}: {
  title: string;
  issues?: z.infer<typeof issueSchema>[];
  children?: React.ReactNode;
}) {
  if (!issues?.length) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-zinc-800 p-3">
        <DialogTitle className="text-center font-semibold text-xl">{title}</DialogTitle>
        {issues && issues.length > 0 && (
          <ScrollArea className="max-h-[50vh] rounded-2xl bg-zinc-900 p-3">
            {issues?.map((issue) => (
              <IssueDialog key={issue._id} roomId={issue.classroomId} existingIssue={issue}>
                <IssueCard issue={issue} />
              </IssueDialog>
            ))}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
