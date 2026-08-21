import type { Doc, Id } from "@backend/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { useState } from "react";
import { IssueForm } from "../forms/issue-form";

export function IssueDialog({
  roomId,
  existingIssue,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  roomId: Id<"classrooms">;
  existingIssue?: Doc<"issues">;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-zinc-800 p-3" showCloseButton={false} onPointerDownOutside={(e) => e.preventDefault()}>
        <IssueForm roomId={roomId} onSuccess={() => setOpen(false)} existingIssue={existingIssue} />
      </DialogContent>
    </Dialog>
  );
}
