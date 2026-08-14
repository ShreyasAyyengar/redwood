import { api } from "@backend/convex/_generated/api";
import type { Doc, Id } from "@backend/convex/_generated/dataModel";
import { Button } from "@redwood/shad-ui/components/button";
import { DialogClose, DialogFooter, DialogHeader, DialogTitle } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Trash2 } from "lucide-react";
import { getIssueFormValues, issueFormSchema, serializeIssueFormValues } from "../../model/issue-form-schema";
import { DeleteIssueDialog } from "../dialogs/delete-issue-dialog";
import { type IssueFormValues, issueAppForm } from "./issue-form-context";
import { IssueFormFields } from "./issue-form-fields";

export type FormValues = IssueFormValues;

export function IssueForm({
  roomId,
  onSuccess,
  existingIssue,
}: {
  roomId: Id<"classrooms">;
  onSuccess?: () => void;
  existingIssue?: Doc<"issues">;
}) {
  const thisRoom = useQuery(api.core.classrooms.service.getRoom, { id: roomId });
  const createIssue = useMutation(api.core.issues.service.createIssue);
  const editIssue = useMutation(api.core.issues.service.editIssue);

  const form = issueAppForm({
    defaultValues: getIssueFormValues(existingIssue),
    validators: {
      onChange: issueFormSchema,
    },

    onSubmit: async ({ value }: { value: IssueFormValues }) => {
      const serializedValue = serializeIssueFormValues(value);
      if (existingIssue) {
        await editIssue({
          ...serializedValue,
          _id: existingIssue._id,
        });
      } else {
        await createIssue({
          ...serializedValue,
          classroomId: roomId,
        });
      }
      onSuccess?.();
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
                {(field) => <field.IssueDateField existingDate={new Date(existingIssue.issue.reportedAt)} />}
              </form.AppField>
            </>
          ) : (
            <p>Report New Issue</p>
          )}
          <p className="mt-2 text-[14px] text-sm uppercase tracking-widest">{thisRoom?.displayName}</p>
        </DialogTitle>
      </DialogHeader>

      <ScrollArea className="max-h-[calc(100dvh-300px)] rounded-2xl bg-background/40 p-3">
        <IssueFormFields form={form} existingIssue={existingIssue} />
      </ScrollArea>
      <DialogFooter className="my-3">
        <div className="flex w-full justify-between gap-2">
          {existingIssue && (
            <DeleteIssueDialog existingIssue={existingIssue} onDeleted={onSuccess}>
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
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting, state.isDefaultValue]}>
              {([canSubmit, isSubmitting, isDefaultValue]) => (
                <Button
                  className={cn(
                    `${canSubmit ? "bg-foreground hover:cursor-pointer hover:bg-foreground/50" : "cursor-not-allowed hover:bg-accent"}`,
                    `${isSubmitting ? "cursor-wait" : "cursor-default"}`
                  )}
                  onClick={form.handleSubmit}
                  disabled={!canSubmit || (existingIssue && isDefaultValue) || isSubmitting}
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
