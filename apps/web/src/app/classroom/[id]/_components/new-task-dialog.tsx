import type { classroomSchema } from "@redwood/contracts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { useState } from "react";
import type { z } from "zod";
import { NewTaskForm } from "./new-task-form";

export function NewTaskDialog({ roomId, children }: { roomId: z.infer<typeof classroomSchema>["_id"]; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-zinc-800 p-3">
        <DialogHeader>
          <DialogTitle className="mx-auto rounded-md bg-zinc-950/30 px-10 py-3 text-center text-2xl ring-1 ring-white/15">
            Create New Task:
          </DialogTitle>
        </DialogHeader>
        <NewTaskForm roomId={roomId} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
