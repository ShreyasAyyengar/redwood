import type { classroomSchema, maintenanceEntrySchema } from "@redwood/contracts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { useState } from "react";
import type { z } from "zod";
import MaintenanceForm from "./maintenance/maintenance-form";

export default function NewMaintenanceDialog({
  children,
  roomId,
  maintenanceEntry,
}: {
  children: React.ReactNode;
  roomId: z.infer<typeof classroomSchema>["_id"];
  maintenanceEntry?: z.infer<typeof maintenanceEntrySchema>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <form>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="bg-zinc-800 p-3">
          <DialogHeader>
            <DialogTitle className="mx-auto rounded-md bg-zinc-950/30 px-10 py-3 text-center text-2xl ring-1 ring-white/15">
              {maintenanceEntry ? `${maintenanceEntry.completedBy.split("@")[0]}'s` : "New"} Maintenance Log:
            </DialogTitle>
          </DialogHeader>
          <MaintenanceForm roomId={roomId} maintenanceEntry={maintenanceEntry} onSuccess={() => setOpen(false)} />
        </DialogContent>
      </form>
    </Dialog>
  );
}
