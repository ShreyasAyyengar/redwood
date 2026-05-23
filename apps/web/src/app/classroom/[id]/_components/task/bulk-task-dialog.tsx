import { Dialog, DialogContent, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { useState } from "react";
import { BulkTaskForm } from "./bulk-task-form";

export function BulkTaskDialog({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
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
      <DialogContent className="bg-zinc-800 p-3" showCloseButton={false} onPointerDownOutside={(event) => event.preventDefault()}>
        <BulkTaskForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
