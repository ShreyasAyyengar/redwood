import type { classroomSchema, issueSchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../../../lib/orpc-web-client";

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
  const deleteIssueMutation = useMutation(
    webClientORPC.issues.deleteIssue.mutationOptions({
      onMutate: async () => setDeleting(true),
      onSuccess: async () => {
        const issueQueryKey = webClientORPC.issues.getIssues.queryOptions({ input: { classroomId: roomId } }).queryKey;
        await queryClient.invalidateQueries({ queryKey: issueQueryKey });
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
            variant="destructive"
            className={cn("text-black", `${deleting ? "cursor-wait" : "cursor-default"}`)}
            onClick={() => deleteIssueMutation.mutateAsync({ issueId: existingIssue._id })}
          >
            {deleting ? "Deleting..." : "Delete Issue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
