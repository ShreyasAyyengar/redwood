import type { classroomSchema, taskSchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../../../lib/orpc-web-client";

export function DeleteTaskDialog({
  roomId,
  existingTask,
  children,
}: {
  roomId: z.infer<typeof classroomSchema>["_id"];
  existingTask: z.infer<typeof taskSchema>;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();
  const deleteTaskMutation = useMutation(
    webClientORPC.tasks.deleteTask.mutationOptions({
      onMutate: async () => setDeleting(true),
      onSuccess: async () => {
        const taskQueryKey = webClientORPC.tasks.getTasks.queryOptions({ input: { classroomId: roomId } }).queryKey;
        await queryClient.invalidateQueries({ queryKey: taskQueryKey });
        setOpen(false);
        setDeleting(false);
      },
    })
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-zinc-800">
        <DialogTitle className="mb-2 font-semibold text-lg">Are you sure you want to delete this task?</DialogTitle>
        <p>
          This will permanently remove it from the classroom history. We recommend completing a task instead of deleting it. Only delete a task
          if it was created in error or by mistake.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="ghost"
            className={cn("bg-red-500/10 text-red-500 hover:bg-red-600/10 hover:text-red-600", `${deleting ? "cursor-wait" : "cursor-default"}`)}
            onClick={() => deleteTaskMutation.mutateAsync({ taskId: existingTask._id })}
          >
            <Trash2 className="size-4" />

            {deleting ? "Deleting..." : "Delete Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
