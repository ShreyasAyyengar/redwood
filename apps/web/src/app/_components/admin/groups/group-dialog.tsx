import { groupFormSchema, type groupSchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { Input } from "@redwood/shad-ui/components/input";
import { Label } from "@redwood/shad-ui/components/label";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Separator } from "@redwood/shad-ui/components/separator";
import { cn } from "@redwood/shad-ui/lib/utils";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../../lib/orpc-web-client";

export type GroupFormValues = z.infer<typeof groupFormSchema>;
export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {},
});

export function GroupForm({
  existingGroup,
  onSuccess,
}: {
  existingGroup?: z.infer<typeof groupSchema>;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  const addGroup = useMutation(
    webClientORPC.groups.addGroup.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: webClientORPC.groups.getGroups.queryKey() });
        onSuccess?.();
      },
    })
  );

  const updateGroup = useMutation(
    webClientORPC.groups.updateGroup.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: webClientORPC.groups.getGroups.queryKey() });
        queryClient.invalidateQueries({ queryKey: webClientORPC.classrooms.getRooms.queryKey({}) });
        onSuccess?.();
      },
    })
  );

  const deleteGroup = useMutation(
    webClientORPC.groups.deleteGroup.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: webClientORPC.groups.getGroups.queryKey() });
        queryClient.invalidateQueries({ queryKey: webClientORPC.classrooms.getRooms.queryKey({}) });
        onSuccess?.();
      },
    })
  );

  const form = useAppForm({
    defaultValues: existingGroup ?? {
      label: "",
    },
    validators: {
      onChange: groupFormSchema,
      onMount: groupFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (existingGroup) await updateGroup.mutateAsync({ _id: existingGroup._id, label: value.label });
      else await addGroup.mutateAsync({ label: value.label });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <DialogHeader>
        <DialogTitle className="mx-auto rounded-md bg-zinc-950/30 px-10 py-3 text-center text-2xl ring-1 ring-white/15">
          {existingGroup ? "Edit Group" : "Create New Group"}
        </DialogTitle>
      </DialogHeader>

      <ScrollArea className="max-h-[calc(100dvh-300px)] rounded-2xl bg-background/40 p-3">
        <div className="my-2 flex flex-col gap-5 px-1">
          <Separator className="bg-zinc-500" />

          <div className="grid grid-cols-1 gap-6">
            <div className="flex flex-col gap-4">
              <form.Field name="label">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="text-zinc-400">
                      Group Name
                    </Label>
                    <Input
                      id={field.name}
                      value={field.state.value ?? ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Science Wing"
                      className="border-zinc-700 bg-zinc-900/50"
                      autoComplete={"off"}
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900/30 p-4">
              <span className="font-medium text-xs text-zinc-500 uppercase tracking-wider">Preview</span>
              <form.Subscribe selector={(state) => [state.values.label]}>
                {([label]) => (
                  <span className="rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 font-medium text-xs text-zinc-100 transition-colors">
                    {label || "Preview Label"}
                  </span>
                )}
              </form.Subscribe>
            </div>
          </div>

          <Separator className="bg-zinc-500" />
        </div>
      </ScrollArea>

      <DialogFooter>
        <div className="flex w-full justify-between gap-2">
          {existingGroup && (
            <Button
              variant="default"
              onClick={() => deleteGroup.mutateAsync({ id: existingGroup._id })}
              disabled={deleteGroup.isPending}
              className="bg-red-900 text-zinc-300 hover:bg-red-900/50"
            >
              {deleteGroup.isPending ? "Deleting..." : "Delete Group"}
            </Button>
          )}
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                Cancel
              </Button>
            </DialogClose>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty]}>
              {([canSubmit, isSubmitting, isDirty]) => (
                <Button
                  variant="default"
                  className={cn("bg-zinc-100 px-8 text-zinc-950 hover:bg-zinc-200", !canSubmit && "cursor-not-allowed")}
                  onClick={form.handleSubmit}
                  disabled={!canSubmit || isSubmitting || (existingGroup && !isDirty)}
                >
                  {isSubmitting ? (existingGroup ? "Saving..." : "Creating...") : existingGroup ? "Save Changes" : "Create Group"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </div>
      </DialogFooter>
    </div>
  );
}

export default function GroupDialog({
  children,
  existingGroup,
}: {
  children?: React.ReactNode;
  existingGroup?: z.infer<typeof groupSchema>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="border-zinc-700 bg-zinc-800 p-6 sm:max-w-[600px]">
        <GroupForm onSuccess={() => setOpen(false)} existingGroup={existingGroup} />
      </DialogContent>
    </Dialog>
  );
}
