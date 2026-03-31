import { type classroomSchema, issueFormSchema, type issueSchema, updateIssueRequestSchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { DialogClose, DialogFooter, DialogHeader } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Separator } from "@redwood/shad-ui/components/separator";
import { cn } from "@redwood/shad-ui/lib/utils";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../../../lib/orpc-web-client";
import CruzfixField from "./fields/cruzfix-field";
import DescriptionField from "./fields/description-field";
import IssueDateField from "./fields/issue-date-field";
import IssueHeader from "./fields/issue-header";
import SodIDField from "./fields/sod-field";
import SupervisorNeededField from "./fields/supervisor-needed-field";
import UrgentField from "./fields/urgent-field";
import { DeleteIssueDialog } from "./issue-delete-dialog";

export type FormValues = z.input<typeof issueFormSchema>;
export type EditFormValues = z.input<typeof updateIssueRequestSchema>;
export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    IssueDateField,
    DescriptionField,
    UrgentField,
    SupervisorNeededField,
    CruzfixField,
    SodIDField,
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
  const [reportedBy, setReportedBy] = useState<string | undefined>(existingIssue?.issue.reportedBy ?? undefined);

  const createIssue = useMutation(
    webClientORPC.issues.createIssue.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: webClientORPC.issues.getIssues.queryOptions({ input: { classroomId: roomId } }).queryKey,
        });
        onSuccess?.();
      },
    })
  );

  const editIssue = useMutation(
    webClientORPC.issues.editIssue.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: webClientORPC.issues.getIssues.queryOptions({ input: { classroomId: roomId } }).queryKey,
        });
        onSuccess?.();
      },
    })
  );

  const form = useAppForm({
    defaultValues: {
      _id: existingIssue?._id,
      issue: {
        issueDate: existingIssue?.issue.issueDate ?? new Date(),
        description: existingIssue?.issue.description ?? "",
        urgent: existingIssue?.issue.urgent ?? false,
        supervisorNeeded: existingIssue?.issue.supervisorNeeded ?? false,
        cruzfixId: existingIssue?.issue.cruzfixId ?? undefined,
        sodId: existingIssue?.issue.sodId ?? undefined,
      },
    } as FormValues | EditFormValues,
    validators: {
      onChange: existingIssue ? updateIssueRequestSchema : issueFormSchema,
    },

    onSubmit: async ({ value }: { value: FormValues | EditFormValues }) => {
      if (existingIssue) {
        const editValue = value as EditFormValues;
        await editIssue.mutateAsync({
          ...existingIssue,
          ...editValue,
          issue: {
            ...existingIssue.issue, // re-spread existing issue after defining opening block {}
            ...editValue.issue, // re-spread editValue.issue after defining opening block {}
            reportedBy: reportedBy ?? undefined, // add reportedBy property with fallback value
          },
        });
      } else {
        const createValue = value as FormValues;
        await createIssue.mutateAsync({
          issue: { ...createValue.issue },
          classroomId: roomId,
        });
      }
    },
  });

  return (
    <>
      <DialogHeader>
        <IssueHeader existingValue={existingIssue?.issue.reportedBy} onChange={(value) => setReportedBy(value ?? "")} />
      </DialogHeader>

      <ScrollArea className="max-h-[calc(100dvh-300px)] rounded-2xl bg-background/40 p-3">
        <div className="my-2 flex flex-col gap-5 px-1">
          <Separator className="bg-red-500" />

          {/* Description */}
          <form.AppField name="issue.description">
            {(field) => <field.DescriptionField existingValue={existingIssue?.issue.description} />}
          </form.AppField>

          <Separator className="bg-red-500" />

          {/* Urgent/Supervisor + SOD/Cruzfix */}
          <div className="flex flex-wrap justify-between gap-5">
            <div className="flex flex-col space-y-4">
              <form.AppField name="issue.urgent">{(field) => <field.UrgentField existingValue={existingIssue?.issue.urgent} />}</form.AppField>
              <form.AppField name="issue.supervisorNeeded">
                {(field) => <field.SupervisorNeededField existingValue={existingIssue?.issue.supervisorNeeded} />}
              </form.AppField>
            </div>

            <div className="flex flex-col space-y-4">
              <form.AppField name="issue.cruzfixId">
                {(field) => <field.CruzfixField existingValue={existingIssue?.issue.cruzfixId} />}
              </form.AppField>
              <form.AppField name="issue.sodId">{(field) => <field.SodIDField existingValue={existingIssue?.issue.sodId} />}</form.AppField>
            </div>
          </div>

          <Separator className="bg-red-500" />

          {/* Issue Date */}
          <form.AppField name="issue.issueDate">
            {(field) => <field.IssueDateField existingDate={existingIssue?.issue.issueDate} />}
          </form.AppField>
        </div>
      </ScrollArea>
      <DialogFooter className="my-3">
        <div className="flex w-full justify-between">
          {/** biome-ignore lint/style/noNonNullAssertion: <explanation> */}
          <DeleteIssueDialog roomId={roomId} existingIssue={existingIssue!}>
            <Button className="bg-destructive hover:bg-destructive/50">Delete</Button>
          </DeleteIssueDialog>

          <div className="flex justify-end gap-2">
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
                  {isSubmitting ? (existingIssue ? "Updating..." : "Creating...") : existingIssue ? "Update Issue" : "Create Issue"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </div>
      </DialogFooter>
    </>
  );
}
