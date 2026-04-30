import type { classroomSchema, issueSchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../../../lib/orpc-web-client";
import { useFetchedRoomsStore } from "../../../../_components/room-store";

export function DeleteIssueDialog({
  roomId,
  existingIssue,
  children,
}: {
  roomId: z.infer<typeof classroomSchema>["_id"];
  existingIssue: z.infer<typeof issueSchema>;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const queryClient = useQueryClient();
  const { updateRoom } = useFetchedRoomsStore();

  const refreshRoom = async () => {
    const roomQuery = webClientORPC.classrooms.getRoom.queryOptions({ input: { id: roomId } });

    await queryClient.invalidateQueries({ queryKey: roomQuery.queryKey });
    const data = await queryClient.fetchQuery({ ...roomQuery, staleTime: 0 });
    if (data) updateRoom(roomId, data);
  };

  const deleteIssueMutation = useMutation(
    webClientORPC.issues.deleteIssue.mutationOptions({
      onMutate: async () => setDeleting(true),
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: webClientORPC.issues.getActiveTasks.queryOptions({ input: { classroomId: roomId } }).queryKey,
          }),
          refreshRoom(),
        ]);
        setOpen(false);
        setDeleting(false);
      },
    })
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="bg-zinc-800">
        <DialogTitle className="mb-2 font-semibold text-lg">Are you sure you want to delete this issue?</DialogTitle>
        <p>
          This will permanently remove it from the classroom history. We recommend resolving an issue instead of deleting it. Only delete an
          issue if it was created in error or by mistake.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>

          <Button
            variant="ghost"
            className={cn("bg-red-500/10 text-red-500 hover:bg-red-600/10 hover:text-red-600", `${deleting ? "cursor-wait" : "cursor-default"}`)}
            onClick={() => deleteIssueMutation.mutateAsync({ issueId: existingIssue._id })}
          >
            <Trash2 className="size-4" />

            {deleting ? "Deleting..." : "Delete Issue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
