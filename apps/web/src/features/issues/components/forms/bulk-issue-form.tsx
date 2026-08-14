import { api } from "@backend/convex/_generated/api";
import type { Id } from "@backend/convex/_generated/dataModel";
import { Button } from "@redwood/shad-ui/components/button";
import { DialogClose, DialogFooter, DialogHeader, DialogTitle } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { BulkTargetSelector } from "@/features/classrooms/components/bulk-target-selector";
import { issueFormSchema, serializeIssueFormValues } from "../../model/issue-form-schema";
import { type IssueFormValues, issueAppForm } from "./issue-form-context";
import { IssueFormFields } from "./issue-form-fields";

export function BulkIssueForm({ onSuccess }: { onSuccess?: () => void }) {
  const fetchedRooms = useQuery(api.core.classrooms.service.getAllRooms, {}) ?? [];
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>([]);

  const bulkCreateIssues = useMutation(api.core.issues.service.createBulkIssues);

  const targetClassroomIds = useMemo(() => {
    const classroomIds = new Set(selectedClassroomIds);
    const attributeIds = new Set(selectedAttributeIds);
    return fetchedRooms
      .filter((room) => classroomIds.has(room._id) || room.attributes.some((attributeId) => attributeIds.has(attributeId)))
      .map((room) => room._id);
  }, [fetchedRooms, selectedAttributeIds, selectedClassroomIds]);

  const form = issueAppForm({
    defaultValues: {
      description: "",
      urgent: false,
      supervisorNeeded: false,
      cruzfixId: undefined,
      sodId: undefined,
      onHold: false,
    } as IssueFormValues,
    validators: {
      onChange: issueFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (targetClassroomIds.length === 0) return;

      await bulkCreateIssues({
        ...serializeIssueFormValues(value),
        attributeIds: selectedAttributeIds as Id<"attributes">[],
        classroomIds: selectedClassroomIds as Id<"classrooms">[],
      });
      onSuccess?.();
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
                  canSubmit && targetClassroomIds.length > 0
                    ? "bg-foreground hover:cursor-pointer hover:bg-foreground/50"
                    : "cursor-not-allowed hover:bg-accent",
                  isSubmitting ? "cursor-wait" : "cursor-default"
                )}
                onClick={form.handleSubmit}
                disabled={!canSubmit || isSubmitting || targetClassroomIds.length === 0}
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
