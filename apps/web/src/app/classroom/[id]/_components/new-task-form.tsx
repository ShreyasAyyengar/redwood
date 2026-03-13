import { type classroomSchema, taskFormSchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { DialogClose, DialogFooter } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Separator } from "@redwood/shad-ui/components/separator";
import { cn } from "@redwood/shad-ui/lib/utils";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { z } from "zod";
import { webClientORPC } from "../../../../lib/orpc-web-client";
import DescriptionField from "./task/fields/description-field";
import TaskDateField from "./task/fields/task-date-field";
import UrgentField from "./task/fields/urgent-field";

export type FormValues = z.input<typeof taskFormSchema>;
export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TaskDateField,
    DescriptionField,
    UrgentField,
  },
  formComponents: {},
});

export function NewTaskForm({ roomId, onSuccess }: { roomId: z.infer<typeof classroomSchema>["_id"]; onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  const createTask = useMutation(
    webClientORPC.maintenance.addTask.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: webClientORPC.maintenance.getTasks.queryOptions({ input: { classroomId: roomId } }).queryKey,
        });
        onSuccess?.();
      },
    })
  );

  const form = useAppForm({
    defaultValues: {} as FormValues,
    validators: {
      onChange: taskFormSchema,
    },
    onSubmit: async ({ value }) => {
      await createTask.mutateAsync({
        task: { ...value.task },
        classroomId: roomId,
      });
    },
  });

  return (
    <>
      <ScrollArea className="max-h-[calc(100dvh-300px)] rounded-2xl bg-background/40 p-3">
        <div className="my-2 flex flex-col gap-5 px-1">
          <Separator className="bg-indigo-500" />

          {/* Description */}
          <form.AppField name="task.description">{(field) => <field.DescriptionField />}</form.AppField>

          <Separator className="bg-indigo-500" />

          {/* Urgent */}
          <form.AppField name="task.urgent">{(field) => <field.UrgentField />}</form.AppField>

          <Separator className="bg-indigo-500" />

          {/* Dates */}
          <div className="mx-auto flex w-full justify-between">
            <div>
              <form.AppField name="task.visibleAt">{(field) => <field.TaskDateField label="Visible At" name="task.visibleAt" />}</form.AppField>
            </div>
            <div>
              <form.AppField name="task.completeBy">
                {(field) => <field.TaskDateField label="Complete By" name="task.completeBy" />}
              </form.AppField>
            </div>
          </div>
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
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </>
  );
}
