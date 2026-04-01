import type { classroomSchema, taskSchema } from "@redwood/contracts";
import { Dialog, DialogContent, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { useState } from "react";
import type { z } from "zod";
import { TaskForm } from "./task-form";

export function TaskDialog({
  roomId,
  existingTask,
  children,
}: {
  roomId: z.infer<typeof classroomSchema>["_id"];
  existingTask?: z.infer<typeof taskSchema>;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-zinc-800 p-3">
        <TaskForm roomId={roomId} existingTask={existingTask} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
