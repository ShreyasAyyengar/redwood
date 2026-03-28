import type { classroomSchema, issueSchema } from "@redwood/contracts";
import { Dialog, DialogContent, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { useState } from "react";
import type { z } from "zod";
import { IssueForm } from "./issue-form";

export function NewIssueDialog({
  roomId,
  existingIssue,
  children,
}: {
  roomId: z.infer<typeof classroomSchema>["_id"];
  existingIssue?: z.infer<typeof issueSchema>;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-zinc-800 p-3">
        <IssueForm roomId={roomId} onSuccess={() => setOpen(false)} existingIssue={existingIssue} />
      </DialogContent>
    </Dialog>
  );
}
