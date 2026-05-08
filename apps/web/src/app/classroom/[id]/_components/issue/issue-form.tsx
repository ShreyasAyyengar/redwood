import { type classroomSchema, type issueSchema, uiIssueFormSchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { DialogClose, DialogFooter, DialogHeader, DialogTitle } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Separator } from "@redwood/shad-ui/components/separator";
import { cn } from "@redwood/shad-ui/lib/utils";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import type { z } from "zod";
import { webClientORPC } from "../../../../../lib/orpc-web-client";
import { applyIssueMutationResult } from "../../../../../util/cache-reconciliation";
import { useFetchedRoomsStore } from "../../../../_components/room-store";
import CruzfixField from "./fields/cruzfix-field";
import DescriptionField from "./fields/description-field";
import IssueDateField from "./fields/issue-date-field";
import ReportedByFieldSelector from "./fields/reported-by-field-selector";
import ResolutionField from "./fields/resolution-field";
import SodIDField from "./fields/sod-field";
import SupervisorNeededField from "./fields/supervisor-needed-field";
import UrgentField from "./fields/urgent-field";
import { DeleteIssueDialog } from "./issue-delete-dialog";

export type FormValues = z.input<typeof uiIssueFormSchema>;
export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    DescriptionField,
    UrgentField,
    SupervisorNeededField,
    CruzfixField,
    SodIDField,
    ReportedByFieldSelector,
    IssueDateField,
    ResolutionField,
  },
  formComponents: {},
});

export function IssueForm({
  roomId,
  onSuccess,
  existingIssue,
}: {
  roomId: z.infer<typeof classroomSchema>["_id"];
  onSuccess?: () => void;
  existingIssue?: z.infer<typeof issueSchema>;
}) {
  const queryClient = useQueryClient();
  const { fetchedRooms } = useFetchedRoomsStore();
  const thisRoom = fetchedRooms.find((room) => room._id === roomId);

  const createIssue = useMutation(
    webClientORPC.issues.createIssue.mutationOptions({
      onSuccess: (mutationResult) => {
        onSuccess?.();
        applyIssueMutationResult(queryClient, mutationResult, "upsert");
      },
    })
  );

  const editIssue = useMutation(
    webClientORPC.issues.editIssue.mutationOptions({
      onSuccess: (mutationResult) => {
        onSuccess?.();
        applyIssueMutationResult(queryClient, mutationResult, "upsert");
      },
    })
  );

  const form = useAppForm({
    defaultValues: {
      description: existingIssue?.issue.description ?? "",
      urgent: existingIssue?.issue.urgent ?? false,
      supervisorNeeded: existingIssue?.issue.supervisorNeeded ?? false,
      cruzfixId: existingIssue?.issue.cruzfixId ?? undefined,
      sodId: existingIssue?.issue.sodId ?? undefined,
    } as FormValues,
    validators: {
      onChange: uiIssueFormSchema,
    },

    onSubmit: async ({ value }: { value: FormValues }) => {
      if (existingIssue) {
        await editIssue.mutateAsync({
          ...value,
          _id: existingIssue._id,
        });
      } else {
        const createValue = value as FormValues;
        await createIssue.mutateAsync({
          ...createValue,
          classroomId: roomId,
        });
      }
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle className="mx-auto rounded-md bg-zinc-950/30 px-10 py-3 text-center text-2xl ring-1 ring-white/15">
          {existingIssue ? (
            <>
              <form.AppField name="reportedBy">
                {(field) => <field.ReportedByFieldSelector existingValue={existingIssue.issue.reportedBy} />}
              </form.AppField>

              <form.AppField name="reportedAt">
                {(field) => <field.IssueDateField existingDate={existingIssue?.issue.reportedAt} />}
              </form.AppField>
            </>
          ) : (
            <p>Report New Issue</p>
          )}
          <p className="mt-2 text-[14px] text-sm uppercase tracking-widest">{thisRoom?.displayName}</p>
        </DialogTitle>
      </DialogHeader>

      <ScrollArea className="max-h-[calc(100dvh-300px)] rounded-2xl bg-background/40 p-3">
        <div className="my-2 flex flex-col gap-5 px-1">
          <Separator className={cn(existingIssue ? existingIssue.issue.urgent && "bg-red-500" : "bg-neutral-500")} />

          {/* Description */}
          <form.AppField name="description">
            {(field) => <field.DescriptionField existingValue={existingIssue?.issue.description} />}
          </form.AppField>

          <Separator className={cn(existingIssue ? existingIssue.issue.urgent && "bg-red-500" : "bg-neutral-500")} />

          {/* Urgent/Supervisor + SOD/Cruzfix */}
          <div className="flex flex-wrap justify-between gap-5">
            <div className="flex flex-col space-y-4">
              <form.AppField name="urgent">{(field) => <field.UrgentField existingValue={existingIssue?.issue.urgent} />}</form.AppField>
              <form.AppField name="supervisorNeeded">
                {(field) => <field.SupervisorNeededField existingValue={existingIssue?.issue.supervisorNeeded} />}
              </form.AppField>
            </div>

            <div className="flex flex-col space-y-4">
              <form.AppField name="cruzfixId">{(field) => <field.CruzfixField existingValue={existingIssue?.issue.cruzfixId} />}</form.AppField>
              <form.AppField name="sodId">{(field) => <field.SodIDField existingValue={existingIssue?.issue.sodId} />}</form.AppField>
            </div>
          </div>

          <Separator className={cn(existingIssue ? existingIssue.issue.urgent && "bg-red-500" : "bg-neutral-500")} />
          {existingIssue && (
            <form.AppField name="resolution">{(field) => <field.ResolutionField existingValue={existingIssue.resolution} />}</form.AppField>
          )}
        </div>
      </ScrollArea>
      <DialogFooter className="my-3">
        <div className="flex w-full justify-between gap-2">
          {existingIssue && (
            <DeleteIssueDialog existingIssue={existingIssue}>
              <Button variant="ghost" className="bg-red-500/10 text-red-500 hover:bg-red-600/10 hover:text-red-600">
                <Trash2 className="size-4" />
                Delete Issue
              </Button>
            </DeleteIssueDialog>
          )}

          <div className="flex w-full justify-end gap-2">
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
                  {isSubmitting ? (existingIssue ? "Saving..." : "Creating...") : existingIssue ? "Save Changes" : "Create Issue"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </div>
      </DialogFooter>
    </>
  );
}
