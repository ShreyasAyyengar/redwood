import { api } from "@backend/convex/_generated/api";
import type { Doc } from "@backend/convex/_generated/dataModel";
import { Button } from "@redwood/shad-ui/components/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useMutation } from "convex/react";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export function DeleteIssueDialog({
  existingIssue,
  children,
  onDeleted,
}: {
  existingIssue: Doc<"issues">;
  children?: React.ReactNode;
  onDeleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteIssue = useMutation(api.core.issues.service.deleteIssue);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteIssue({ _id: existingIssue._id });
      setOpen(false);
      onDeleted?.();
    } finally {
      setDeleting(false);
    }
  };

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
            onClick={handleDelete}
          >
            <Trash2 className="size-4" />

            {deleting ? "Deleting..." : "Delete Issue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
