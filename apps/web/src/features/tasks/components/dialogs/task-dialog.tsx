import type { Doc, Id } from "@backend/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { useState } from "react";
import { TaskForm } from "../forms/task-form";

export function TaskDialog({
  roomId,
  existingTask,
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  roomId: Id<"classrooms">;
  existingTask?: Doc<"tasks">;
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
        <TaskForm roomId={roomId} existingTask={existingTask} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
