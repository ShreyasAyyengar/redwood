import { uiTaskFormSchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { Field, FieldLabel } from "@redwood/shad-ui/components/field";
import { Input } from "@redwood/shad-ui/components/input";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@redwood/shad-ui/components/select";
import { Textarea } from "@redwood/shad-ui/components/textarea";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { webClientORPC } from "../../../../../lib/orpc-web-client";
import { applyTaskMutationResult } from "../../../../../util/cache-reconciliation";
import { BulkTargetSelector, resolveBulkTargetClassroomIds } from "../../../../_components/bulk-target-selector";
import { useFetchedRoomsStore } from "../../../../_components/room-store";
import { type TaskFormValues, taskAppForm } from "./task-form-context";
import { TaskFormFields } from "./task-form-fields";

export function BulkTaskForm({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  const { fetchedRooms } = useFetchedRoomsStore();
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>([]);
  const [allClassroomsSelected, setAllClassroomsSelected] = useState(false);

  const bulkAddTasks = useMutation(
    webClientORPC.tasks.bulkAddTasks.mutationOptions({
      onSuccess: (mutationResult) => {
        mutationResult.mutatedTasks.forEach((mutatedTask, index) => {
          const roomSnapshot = mutationResult.roomSnapshots[index];
          if (!roomSnapshot) return;
          applyTaskMutationResult(queryClient, { mutatedTask, roomSnapshot }, "upsert");
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
        allClassroomsSelected,
      }),
    [allClassroomsSelected, fetchedRooms, selectedAttributeIds, selectedClassroomIds]
  );

  const form = taskAppForm({
    defaultValues: {
      description: "",
      urgent: false,
      supervisorNeeded: false,
      visibleAt: undefined,
      completeBy: undefined,
    } as TaskFormValues,
    validators: {
      onChange: uiTaskFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (targetSummary.targetClassroomIds.length === 0) return;

      await bulkAddTasks.mutateAsync({
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
          Create Bulk Task
        </DialogTitle>
      </DialogHeader>

      <ScrollArea className="max-h-[calc(100dvh-300px)] rounded-2xl bg-background/40 p-3">
        <div className="my-2 flex flex-col gap-5 px-1">
          <TaskTemplateControls
            setDescription={(description) => form.setFieldValue("description", description)}
            selectedAttributeIds={selectedAttributeIds}
            selectedClassroomIds={selectedClassroomIds}
            setSelectedAttributeIds={setSelectedAttributeIds}
            setSelectedClassroomIds={setSelectedClassroomIds}
            setAllClassroomsSelected={setAllClassroomsSelected}
          />
          <BulkTargetSelector
            selectedAttributeIds={selectedAttributeIds}
            selectedClassroomIds={selectedClassroomIds}
            onAttributeIdsChange={setSelectedAttributeIds}
            onClassroomIdsChange={setSelectedClassroomIds}
            allClassroomsSelected={allClassroomsSelected}
            onAllClassroomsSelectedChange={setAllClassroomsSelected}
          />
          <TaskFormFields form={form} />
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
                {isSubmitting ? "Creating..." : "Create Bulk Tasks"}
              </Button>
            )}
          </form.Subscribe>
        </div>
      </DialogFooter>
    </>
  );
}

function TaskTemplateControls({
  setDescription,
  selectedAttributeIds,
  selectedClassroomIds,
  setSelectedAttributeIds,
  setSelectedClassroomIds,
  setAllClassroomsSelected,
}: {
  setDescription: (description: string) => void;
  selectedAttributeIds: string[];
  selectedClassroomIds: string[];
  setSelectedAttributeIds: (attributeIds: string[]) => void;
  setSelectedClassroomIds: (classroomIds: string[]) => void;
  setAllClassroomsSelected: (selected: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templateAttributeIds, setTemplateAttributeIds] = useState<string[]>(selectedAttributeIds);
  const [templateClassroomIds, setTemplateClassroomIds] = useState<string[]>(selectedClassroomIds);
  const [templateAllClassroomsSelected, setTemplateAllClassroomsSelected] = useState(false);

  const { data: templates = [] } = useQuery(webClientORPC.tasks.getTaskTemplates.queryOptions());

  const addTemplate = useMutation(
    webClientORPC.tasks.addTaskTemplate.mutationOptions({
      onSuccess: async (template) => {
        await queryClient.invalidateQueries({ queryKey: webClientORPC.tasks.getTaskTemplates.queryKey() });
        applyTemplate(template);
        setTemplateDialogOpen(false);
        setTemplateName("");
        setTemplateDescription("");
        setTemplateAttributeIds([]);
        setTemplateClassroomIds([]);
        setTemplateAllClassroomsSelected(false);
      },
    })
  );

  const applyTemplate = (template: (typeof templates)[number]) => {
    const appliesToAllClassrooms = template.attributeIds.length === 0 && template.classroomIds.length === 0;

    setDescription(template.description);
    setSelectedAttributeIds(template.attributeIds);
    setSelectedClassroomIds(template.classroomIds);
    setAllClassroomsSelected(appliesToAllClassrooms);
  };

  const canCreateTemplate =
    templateName.trim().length > 0 &&
    templateDescription.trim().length > 0 &&
    (templateAllClassroomsSelected || templateAttributeIds.length > 0 || templateClassroomIds.length > 0);

  return (
    <div className="rounded-lg border border-white/10 bg-zinc-950/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lg">Task Template</h3>
          <p className="text-muted-foreground text-sm">Use a saved template or create one from reusable targets.</p>
        </div>
        <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">New Template</Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-800 p-3" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Create Task Template</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input value={templateName} onChange={(event) => setTemplateName(event.target.value)} placeholder="Template name" />
              </Field>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  value={templateDescription}
                  onChange={(event) => setTemplateDescription(event.target.value)}
                  placeholder="Template task description"
                />
              </Field>
              <BulkTargetSelector
                selectedAttributeIds={templateAttributeIds}
                selectedClassroomIds={templateClassroomIds}
                onAttributeIdsChange={setTemplateAttributeIds}
                onClassroomIdsChange={setTemplateClassroomIds}
                selectAllBehavior="empty-targets"
                allClassroomsSelected={templateAllClassroomsSelected}
                onAllClassroomsSelectedChange={setTemplateAllClassroomsSelected}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                disabled={!canCreateTemplate || addTemplate.isPending}
                onClick={() =>
                  addTemplate.mutate({
                    name: templateName,
                    description: templateDescription,
                    attributeIds: templateAttributeIds,
                    classroomIds: templateClassroomIds,
                  })
                }
              >
                {addTemplate.isPending ? "Creating..." : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Select
        onValueChange={(templateId) => {
          const template = templates.find((item) => item._id === templateId);
          if (template) applyTemplate(template);
        }}
      >
        {templates.length > 0 && (
          <SelectTrigger className="mt-3 w-full bg-zinc-950/40">
            <SelectValue placeholder="Use existing template" />
          </SelectTrigger>
        )}
        <SelectContent>
          {templates.map((template) => (
            <SelectItem key={template._id} value={template._id}>
              {template.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
