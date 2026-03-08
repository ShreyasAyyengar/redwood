import type { classroomSchema, maintenanceEntrySchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@redwood/shad-ui/components/dialog";
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
  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="bg-zinc-900">
          <DialogHeader>
            <DialogTitle>{maintenanceEntry ? `${maintenanceEntry.completedBy.split("@")[0]}'s` : "New"} Maintenance Log</DialogTitle>
          </DialogHeader>
          <MaintenanceForm roomId={roomId} maintenanceEntry={maintenanceEntry} />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
