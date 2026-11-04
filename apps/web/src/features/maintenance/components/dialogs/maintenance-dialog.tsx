import type { Doc, Id } from "@backend/convex/_generated/dataModel";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { useState } from "react";
import MaintenanceForm from "../forms/maintenance-form";

export default function MaintenanceDialog({
  children,
  roomId,
  maintenanceEntry,
}: {
  children: React.ReactNode;
  roomId: Id<"classrooms">;
  maintenanceEntry?: Doc<"maintenance">;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-zinc-800 p-3 sm:max-w-[680px]" showCloseButton={false} onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="mx-auto rounded-md bg-zinc-950/30 px-10 py-3 text-center text-2xl ring-1 ring-white/15">
            {maintenanceEntry ? `${maintenanceEntry.completedBy.split("@")[0]}'s` : "New"} Maintenance Log:
          </DialogTitle>
          <DialogDescription className="sr-only">
            {maintenanceEntry
              ? "Review the recorded maintenance checks and results."
              : "Complete the maintenance checks that apply to this classroom."}
          </DialogDescription>
        </DialogHeader>
        <MaintenanceForm roomId={roomId} maintenanceEntry={maintenanceEntry} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
