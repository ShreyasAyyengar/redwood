import { type classroomSchema, issueFormSchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { DialogClose, DialogFooter } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Separator } from "@redwood/shad-ui/components/separator";
import { cn } from "@redwood/shad-ui/lib/utils";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { webClientORPC } from "../../../../lib/orpc-web-client";
import DescriptionField from "./issue/fields/description-field";
import IssueDateField from "./issue/fields/issue-date-field";
import SupervisorNeededField from "./issue/fields/supervisor-needed-field";
import UrgentField from "./issue/fields/urgent-field";

export type FormValues = z.input<typeof issueFormSchema>;
export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    IssueDateField,
    DescriptionField,
    UrgentField,
    SupervisorNeededField,
  },
  formComponents: {},
});

export function NewIssueForm({ roomId, onSuccess }: { roomId: z.infer<typeof classroomSchema>["_id"]; onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  const createIssue = useMutation(
    webClientORPC.maintenance.addIssue.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: webClientORPC.maintenance.getIssues.queryOptions({ input: { classroomId: roomId } }).queryKey,
        });
        onSuccess?.();
      },
    })
  );

  const form = useAppForm({
    defaultValues: {
      issue: {
        description: "",
        urgent: false,
        supervisorNeeded: false,
        issueDate: new Date(),
      },
    } as FormValues,
    validators: {
      onChange: issueFormSchema,
    },
    onSubmit: async ({ value }) => {
      await createIssue.mutateAsync({
        issue: { ...value.issue },
        classroomId: roomId,
      });
    },
  });

  return (
    <>
      <ScrollArea className="max-h-[calc(100dvh-300px)] rounded-2xl bg-background/40 p-3">
        <div className="my-2 flex flex-col gap-5 px-1">
          <Separator className="bg-red-500" />

          {/* Description */}
          <form.AppField name="issue.description">{(field) => <field.DescriptionField />}</form.AppField>

          <Separator className="bg-red-500" />

          {/* Urgent & Supervisor Needed */}
          <div className="flex flex-wrap gap-4">
            <form.AppField name="issue.urgent">{(field) => <field.UrgentField />}</form.AppField>
            <form.AppField name="issue.supervisorNeeded">{(field) => <field.SupervisorNeededField />}</form.AppField>
          </div>

          <Separator className="bg-red-500" />

          {/* Issue Date */}
          <form.AppField name="issue.issueDate">{(field) => <field.IssueDateField />}</form.AppField>
        </div>
      </ScrollArea>
      <DialogFooter className="my-3">
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              className={cn(
                `${canSubmit ? "bg-foreground hover:cursor-pointer hover:bg-foreground/50" : "cursor-not-allowed hover:bg-accent"}`,
                `${isSubmitting ? "cursor-wait" : "cursor-default"}`
              )}
              onClick={form.handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Issue"}
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </>
  );
}
