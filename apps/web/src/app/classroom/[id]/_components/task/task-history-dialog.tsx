import type { classroomSchema, taskSchema } from "@redwood/contracts";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import type React from "react";
import type { z } from "zod";
import { TaskCard } from "./task-card";
import { TaskDialog } from "./task-dialog";

export default function TaskHistoryDialog({
  room,
  tasks,
  children,
}: {
  room: z.infer<typeof classroomSchema>;
  tasks?: z.infer<typeof taskSchema>[];
  children?: React.ReactNode;
}) {
  if (!tasks?.length) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-zinc-800 p-3">
        <DialogTitle className="text-center font-semibold text-xl">Task History: {room.displayName}</DialogTitle>
        {tasks && tasks.length > 0 && (
          <ScrollArea className="max-h-[50vh] rounded-2xl bg-zinc-900 p-3">
            {tasks?.map((task) => (
              <TaskDialog key={task._id} roomId={room._id} existingTask={task}>
                <TaskCard task={task} />
              </TaskDialog>
            ))}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
