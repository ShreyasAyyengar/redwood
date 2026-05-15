import { attributeFormSchema, type attributeSchema } from "@redwood/contracts";
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

export type AttributeFormValues = z.infer<typeof attributeFormSchema>;
export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {},
  formComponents: {},
});

export function AttributeForm({
  existingAttribute,
  onSuccess,
}: {
  existingAttribute?: z.infer<typeof attributeSchema>;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  const addAttribute = useMutation(
    webClientORPC.attributes.addAttribute.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: webClientORPC.attributes.getAttributes.queryKey() });
        onSuccess?.();
      },
    })
  );

  const updateAttribute = useMutation(
    webClientORPC.attributes.updateAttribute.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: webClientORPC.attributes.getAttributes.queryKey() });
        onSuccess?.();
      },
    })
  );

  const deleteAttribute = useMutation(
    webClientORPC.attributes.deleteAttribute.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: webClientORPC.attributes.getAttributes.queryKey() });
        onSuccess?.();
      },
    })
  );

  const form = useAppForm({
    defaultValues: existingAttribute ?? {
      label: "",
      color: "#FFFFFF",
    },
    validators: {
      onChange: attributeFormSchema,
      onMount: attributeFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (existingAttribute) await updateAttribute.mutateAsync({ _id: existingAttribute._id, label: value.label, color: value.color });
      else await addAttribute.mutateAsync({ label: value.label, color: value.color });
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <DialogHeader>
        <DialogTitle className="mx-auto rounded-md bg-zinc-950/30 px-10 py-3 text-center text-2xl ring-1 ring-white/15">
          {existingAttribute ? "Edit Attribute" : "Create New Attribute"}
        </DialogTitle>
      </DialogHeader>

      <ScrollArea className="max-h-[calc(100dvh-300px)] rounded-2xl bg-background/40 p-3">
        <div className="my-2 flex flex-col gap-5 px-1">
          <Separator className="bg-zinc-500" />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex gap-4">
              <form.Field name="label">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="text-zinc-400">
                      Label
                    </Label>
                    <Input
                      id={field.name}
                      value={field.state.value ?? ""}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="e.g. Has Swag"
                      className="border-zinc-700 bg-zinc-900/50"
                      autoComplete={"off"}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="color">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name} className="text-zinc-400">
                      Color
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        id={field.name}
                        value={field.state.value ?? ""}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="h-10 w-20 cursor-pointer border-zinc-700 bg-zinc-900/50 p-1"
                      />
                    </div>
                  </div>
                )}
              </form.Field>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900/30 p-4">
              <span className="font-medium text-xs text-zinc-500 uppercase tracking-wider">Preview</span>
              <form.Subscribe selector={(state) => [state.values.label, state.values.color]}>
                {([label, color]) => {
                  const colorHex = color || "#000000";
                  return (
                    <span
                      className="rounded border px-2 py-0.5 font-medium text-xs transition-colors"
                      style={{
                        backgroundColor: `${colorHex}15`,
                        color: colorHex,
                        borderColor: `${colorHex}40`,
                      }}
                    >
                      {label || "Preview Label"}
                    </span>
                  );
                }}
              </form.Subscribe>
            </div>
          </div>

          <Separator className="bg-zinc-500" />
        </div>
      </ScrollArea>

      <DialogFooter>
        <div className="flex w-full justify-between gap-2">
          {existingAttribute && (
            <Button
              variant="default"
              onClick={() => deleteAttribute.mutateAsync({ id: existingAttribute._id })}
              disabled={deleteAttribute.isPending}
              className="bg-red-900 text-zinc-300 hover:bg-red-900/50"
            >
              {deleteAttribute.isPending ? "Deleting..." : "Delete Attribute"}
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
                  disabled={!canSubmit || isSubmitting || (existingAttribute && !isDirty)}
                >
                  {isSubmitting ? (existingAttribute ? "Saving..." : "Creating...") : existingAttribute ? "Save Changes" : "Create Attribute"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </div>
      </DialogFooter>
    </div>
  );
}

export default function AttributeDialog({
  children,
  existingAttribute,
}: {
  children?: React.ReactNode;
  existingAttribute?: z.infer<typeof attributeSchema>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="border-zinc-700 bg-zinc-800 p-6 sm:max-w-[600px]">
        <AttributeForm onSuccess={() => setOpen(false)} existingAttribute={existingAttribute} />
      </DialogContent>
    </Dialog>
  );
}
