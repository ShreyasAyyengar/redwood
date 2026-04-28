import { type classroomSchema, type taskSchema, uiTaskFormSchema } from "@redwood/contracts";
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
import CompletionField from "./fields/completion-field";
import CreatedByFieldSelector from "./fields/created-by-field-selector";
import DescriptionField from "./fields/description-field";
import TaskDateField from "./fields/task-date-field";
import UrgentField from "./fields/urgent-field";
import { DeleteTaskDialog } from "./task-delete-dialog";

export type FormValues = z.input<typeof uiTaskFormSchema>;
export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    CreatedByFieldSelector,
    TaskDateField,
    DescriptionField,
    UrgentField,
    CompletionField,
  },
  formComponents: {},
});

export function TaskForm({
  roomId,
  existingTask,
  onSuccess,
}: {
  roomId: z.infer<typeof classroomSchema>["_id"];
  existingTask?: z.infer<typeof taskSchema>;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  const createTask = useMutation(
    webClientORPC.tasks.addTask.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: webClientORPC.tasks.getTasks.queryOptions({ input: { classroomId: roomId } }).queryKey,
        });
        onSuccess?.();
      },
    })
  );

  const editTask = useMutation(
    webClientORPC.tasks.editTask.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: webClientORPC.tasks.getTasks.queryOptions({ input: { classroomId: roomId } }).queryKey,
        });
        onSuccess?.();
      },
    })
  );

  const form = useAppForm({
    defaultValues: {
      description: existingTask?.task.description ?? "",
      urgent: existingTask?.task.urgent ?? false,
      visibleAt: existingTask?.task.visibleAt ? existingTask.task.visibleAt : undefined,
      completeBy: existingTask?.task.completeBy ? existingTask.task.completeBy : undefined,
      completion: existingTask?.completion ? { comment: existingTask.completion.comment } : undefined,
      createdBy: existingTask?.createdBy,
    } as FormValues,
    validators: {
      onChange: uiTaskFormSchema,
    },
    onSubmit: async ({ value }) => {
      if (existingTask) {
        await editTask.mutateAsync({
          ...value,
          _id: existingTask._id,
        });
      } else {
        await createTask.mutateAsync({
          ...value,
          classroomId: roomId,
        });
      }
    },
  });

  return (
    <>
      {/* HEADER OUTSIDE SCROLL */}
      <DialogHeader>
        <DialogTitle className="mx-auto rounded-md bg-zinc-950/30 px-10 py-3 text-center text-2xl ring-1 ring-white/15">
          {existingTask ? (
            <form.AppField name="createdBy">
              {(field) => <field.CreatedByFieldSelector existingValue={existingTask?.task.createdBy} />}
            </form.AppField>
          ) : (
            <p>Create New Task</p>
          )}
        </DialogTitle>
      </DialogHeader>

      {/* SCROLL ONLY WRAPS BODY */}
      <ScrollArea className="max-h-[calc(100dvh-300px)] rounded-2xl bg-background/40 p-3">
        <div className="my-2 flex flex-col gap-5 px-1">
          <Separator className="bg-indigo-500" />

          <form.AppField name="description">
            {(field) => <field.DescriptionField existingValue={existingTask?.task.description} />}
          </form.AppField>

          <Separator className="bg-indigo-500" />

          <form.AppField name="urgent">{(field) => <field.UrgentField existingValue={existingTask?.task.urgent} />}</form.AppField>

          <Separator className="bg-indigo-500" />

          <div className="mx-auto flex w-full flex-col justify-between space-y-5 sm:flex-row sm:space-y-0">
            <div>
              <form.AppField name="visibleAt">
                {(field) => (
                  <field.TaskDateField
                    label="Visible At"
                    name="visibleAt"
                    existingDate={existingTask?.task.visibleAt ? new Date(existingTask.task.visibleAt) : undefined}
                  />
                )}
              </form.AppField>
            </div>

            <div>
              <form.AppField name="completeBy">
                {(field) => (
                  <field.TaskDateField
                    label="Complete By"
                    name="completeBy"
                    existingDate={existingTask?.task.completeBy ? new Date(existingTask.task.completeBy) : undefined}
                  />
                )}
              </form.AppField>
            </div>
          </div>

          {existingTask && (
            <>
              <Separator className="bg-indigo-500" />
              <form.AppField name="completion">{(field) => <field.CompletionField existingValue={existingTask?.completion} />}</form.AppField>
            </>
          )}
        </div>
      </ScrollArea>

      <DialogFooter className="my-3">
        <div className="flex w-full items-center justify-between">
          <div>
            {existingTask && (
              <DeleteTaskDialog roomId={roomId} existingTask={existingTask}>
                <Button variant="ghost" className="bg-red-500/10 text-red-500 hover:bg-red-600/10 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                  Delete Task
                </Button>
              </DeleteTaskDialog>
            )}
          </div>

          <div className="flex gap-2">
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
                  {isSubmitting ? (existingTask ? "Saving..." : "Creating...") : existingTask ? "Save Changes" : "Create Task"}
                </Button>
              )}
            </form.Subscribe>
          </div>
        </div>
      </DialogFooter>
    </>
  );
}
