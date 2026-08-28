"use client";

import { api } from "@backend/convex/_generated/api";
import type { Doc, Id } from "@backend/convex/_generated/dataModel";
import { Badge } from "@redwood/shad-ui/components/badge";
import { Button } from "@redwood/shad-ui/components/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@redwood/shad-ui/components/dialog";
import { Input } from "@redwood/shad-ui/components/input";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { useMutation } from "convex/react";
import { Check, LoaderCircle, Pencil, Plus, Settings2, Trash2, X } from "lucide-react";
import { useState } from "react";

type CategoryManagerDialogProps = {
  categories: Doc<"hotlineCategories">[];
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function CategoryManagerDialog({ categories, onOpenChange, open }: CategoryManagerDialogProps) {
  const createCategory = useMutation(api.core.hotline.service.createHotlineCategory);
  const updateCategory = useMutation(api.core.hotline.service.updateHotlineCategory);
  const deleteCategory = useMutation(api.core.hotline.service.deleteHotlineCategory);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<Id<"hotlineCategories">>();
  const [editingLabel, setEditingLabel] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<Id<"hotlineCategories">>();
  const [activeOperation, setActiveOperation] = useState<"create" | Id<"hotlineCategories">>();
  const [error, setError] = useState<string>();

  const handleCreate = async () => {
    const label = newLabel.trim();
    if (!label) return;
    setActiveOperation("create");
    setError(undefined);
    try {
      await createCategory({ label });
      setNewLabel("");
    } catch (mutationError) {
      setError(String(mutationError));
    } finally {
      setActiveOperation(undefined);
    }
  };

  const handleUpdate = async (categoryId: Id<"hotlineCategories">) => {
    const label = editingLabel.trim();
    if (!label) return;
    setActiveOperation(categoryId);
    setError(undefined);
    try {
      await updateCategory({ _id: categoryId, label });
      setEditingId(undefined);
      setEditingLabel("");
    } catch (mutationError) {
      setError(String(mutationError));
    } finally {
      setActiveOperation(undefined);
    }
  };

  const handleDelete = async (categoryId: Id<"hotlineCategories">) => {
    setActiveOperation(categoryId);
    setError(undefined);
    try {
      await deleteCategory({ _id: categoryId });
      setPendingDeleteId(undefined);
    } catch (mutationError) {
      setError(String(mutationError));
    } finally {
      setActiveOperation(undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden border-zinc-700 bg-zinc-900 sm:max-w-md"
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300">
              <Settings2 className="size-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle>Hotline categories</DialogTitle>
              <DialogDescription className="mt-1">Create, rename, or remove the categories available to hotline logs.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 min-w-0 space-y-4 overflow-y-auto overscroll-contain p-1">
          <form
            className="flex min-w-0 gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              await handleCreate();
            }}
          >
            <Input
              value={newLabel}
              onChange={(event) => setNewLabel(event.target.value)}
              placeholder="New category name"
              aria-label="New hotline category name"
              className="min-w-0 flex-1 border-zinc-700 bg-zinc-950/50"
            />
            <Button type="submit" disabled={!newLabel.trim() || activeOperation !== undefined} className="shrink-0">
              {activeOperation === "create" ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add
            </Button>
          </form>

          {error && (
            <p className="max-w-full break-words rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-300 text-sm [overflow-wrap:anywhere]">
              {error}
            </p>
          )}

          <div className="min-w-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/30">
            <div className="flex items-center justify-between border-zinc-800 border-b px-3 py-2">
              <span className="font-semibold text-xs text-zinc-500 uppercase tracking-wider">Configured categories</span>
              <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                {categories.length}
              </Badge>
            </div>
            <ScrollArea className="max-h-80">
              <div className="divide-y divide-zinc-800">
                {categories.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-zinc-500">No categories have been configured.</p>
                ) : (
                  categories.map((category) => {
                    const isEditing = editingId === category._id;
                    const isPendingDelete = pendingDeleteId === category._id;
                    const isBusy = activeOperation === category._id;

                    return (
                      <div key={category._id} className="flex min-h-14 items-center gap-2 px-3 py-2">
                        {isEditing ? (
                          <form
                            className="flex min-w-0 flex-1 gap-2"
                            onSubmit={async (event) => {
                              event.preventDefault();
                              await handleUpdate(category._id);
                            }}
                          >
                            <Input
                              autoFocus
                              value={editingLabel}
                              onChange={(event) => setEditingLabel(event.target.value)}
                              aria-label={`Rename ${category.label}`}
                              className="h-8 min-w-0 border-zinc-600 bg-zinc-900"
                            />
                            <Button type="submit" size="icon-sm" disabled={!editingLabel.trim() || isBusy} aria-label="Save category name">
                              {isBusy ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}
                            </Button>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingId(undefined);
                                setEditingLabel("");
                              }}
                              aria-label="Cancel renaming category"
                            >
                              <X className="size-4" />
                            </Button>
                          </form>
                        ) : (
                          <>
                            <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{category.label}</span>
                            {isPendingDelete ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  disabled={isBusy}
                                  onClick={async () => {
                                    await handleDelete(category._id);
                                  }}
                                >
                                  {isBusy && <LoaderCircle className="size-3.5 animate-spin" />}
                                  Confirm
                                </Button>
                                <Button type="button" size="sm" variant="ghost" onClick={() => setPendingDeleteId(undefined)} disabled={isBusy}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="ghost"
                                  className="text-zinc-500 hover:text-zinc-100"
                                  onClick={() => {
                                    setPendingDeleteId(undefined);
                                    setEditingId(category._id);
                                    setEditingLabel(category.label);
                                    setError(undefined);
                                  }}
                                  aria-label={`Rename ${category.label}`}
                                >
                                  <Pencil className="size-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon-sm"
                                  variant="ghost"
                                  className="text-zinc-600 hover:bg-red-500/10 hover:text-red-400"
                                  onClick={() => {
                                    setEditingId(undefined);
                                    setPendingDeleteId(category._id);
                                    setError(undefined);
                                  }}
                                  aria-label={`Delete ${category.label}`}
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
