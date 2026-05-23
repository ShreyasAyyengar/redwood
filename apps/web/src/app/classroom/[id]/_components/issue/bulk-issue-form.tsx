import { uiIssueFormSchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { DialogClose, DialogFooter, DialogHeader, DialogTitle } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { webClientORPC } from "../../../../../lib/orpc-web-client";
import { applyIssueMutationResult } from "../../../../../util/cache-reconciliation";
import { BulkTargetSelector, resolveBulkTargetClassroomIds } from "../../../../_components/bulk-target-selector";
import { useFetchedRoomsStore } from "../../../../_components/room-store";
import { type IssueFormValues, issueAppForm } from "./issue-form-context";
import { IssueFormFields } from "./issue-form-fields";

export function BulkIssueForm({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  const { fetchedRooms } = useFetchedRoomsStore();
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>([]);

  const bulkCreateIssues = useMutation(
    webClientORPC.issues.bulkCreateIssues.mutationOptions({
      onSuccess: (mutationResult) => {
        mutationResult.mutatedIssues.forEach((mutatedIssue, index) => {
          const roomSnapshot = mutationResult.roomSnapshots[index];
          if (!roomSnapshot) return;
          applyIssueMutationResult(queryClient, { mutatedIssue, roomSnapshot }, "upsert");
        });
        onSuccess?.();
      },
    })
  );

  const targetSummary = useMemo(
    () =>
      resolveBulkTargetClassroomIds({
        classrooms: fetchedRooms,
        selectedAttributeIds,
        selectedClassroomIds,
      }),
    [fetchedRooms, selectedAttributeIds, selectedClassroomIds]
  );

  const form = issueAppForm({
    defaultValues: {
      description: "",
      urgent: false,
      supervisorNeeded: false,
      cruzfixId: undefined,
      sodId: undefined,
    } as IssueFormValues,
    validators: {
      onChange: uiIssueFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (targetSummary.targetClassroomIds.length === 0) return;

      await bulkCreateIssues.mutateAsync({
        ...value,
        attributeIds: selectedAttributeIds,
        classroomIds: selectedClassroomIds,
      });
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle className="mx-auto rounded-md bg-zinc-950/30 px-10 py-3 text-center text-2xl ring-1 ring-white/15">
          Create Bulk Issue
        </DialogTitle>
      </DialogHeader>

      <ScrollArea className="max-h-[calc(100dvh-300px)] rounded-2xl bg-background/40 p-3">
        <div className="my-2 flex flex-col gap-5 px-1">
          <BulkTargetSelector
            selectedAttributeIds={selectedAttributeIds}
            selectedClassroomIds={selectedClassroomIds}
            onAttributeIdsChange={setSelectedAttributeIds}
            onClassroomIdsChange={setSelectedClassroomIds}
          />
          <IssueFormFields form={form} />
        </div>
      </ScrollArea>

      <DialogFooter className="my-3">
        <div className="flex w-full justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button
                className={cn(
                  canSubmit && targetSummary.targetClassroomIds.length > 0
                    ? "bg-foreground hover:cursor-pointer hover:bg-foreground/50"
                    : "cursor-not-allowed hover:bg-accent",
                  isSubmitting ? "cursor-wait" : "cursor-default"
                )}
                onClick={form.handleSubmit}
                disabled={!canSubmit || isSubmitting || targetSummary.targetClassroomIds.length === 0}
              >
                {isSubmitting ? "Creating..." : "Create Bulk Issues"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </DialogFooter>
    </>
  );
}
