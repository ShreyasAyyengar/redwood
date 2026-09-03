"use client";

import { api } from "@backend/convex/_generated/api";
import type { Doc } from "@backend/convex/_generated/dataModel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@redwood/shad-ui/components/alert-dialog";
import { Button } from "@redwood/shad-ui/components/button";
import { useMutation } from "convex/react";
import { LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

export function RowActionsCell({ entry, onEdit }: { entry: Doc<"hotline">; onEdit: (entry: Doc<"hotline">) => void }) {
  const deleteEntry = useMutation(api.core.hotline.service.deleteHotlineEntry);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string>();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setDeleteError(undefined);
    try {
      await deleteEntry({ _id: entry._id });
      setDeleteDialogOpen(false);
    } catch {
      setDeleteError("The hotline entry could not be deleted. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        size="icon-sm"
        variant="ghost"
        className="text-zinc-500 transition-colors hover:bg-zinc-700 hover:text-zinc-100"
        onClick={(event) => {
          event.stopPropagation();
          onEdit(entry);
        }}
        onDoubleClick={(event) => event.stopPropagation()}
        aria-label="Edit hotline entry"
        title="Edit hotline entry"
      >
        <Pencil className="size-4" />
      </Button>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (isDeleting) return;
          setDeleteDialogOpen(open);
          if (!open) setDeleteError(undefined);
        }}
      >
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-400"
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
            aria-label="Delete hotline entry"
            title="Delete hotline entry"
          >
            <Trash2 className="size-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="border-zinc-700 bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this hotline entry?</AlertDialogTitle>
            <AlertDialogDescription>This permanently removes the call from the hotline log.</AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-300 text-sm">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep entry</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={async (event) => {
                event.preventDefault();
                event.stopPropagation();
                await handleDelete();
              }}
            >
              {isDeleting ? <LoaderCircle className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {isDeleting ? "Deleting…" : "Delete entry"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
