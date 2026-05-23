import { type classroomSchema, type taskSchema, uiTaskFormSchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { DialogClose, DialogFooter, DialogHeader, DialogTitle } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import type { z } from "zod";
import { webClientORPC } from "../../../../../lib/orpc-web-client";
import { applyTaskMutationResult } from "../../../../../util/cache-reconciliation";
import { useFetchedRoomsStore } from "../../../../_components/room-store";
import { DeleteTaskDialog } from "./task-delete-dialog";
import { type TaskFormValues, taskAppForm } from "./task-form-context";
import { TaskFormFields } from "./task-form-fields";

export type FormValues = TaskFormValues;

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
  const { fetchedRooms } = useFetchedRoomsStore();
  const thisRoom = fetchedRooms.find((room) => room._id === roomId);

  const createTask = useMutation(
    webClientORPC.tasks.addTask.mutationOptions({
      onSuccess: (mutationResult) => {
        onSuccess?.();
        applyTaskMutationResult(queryClient, mutationResult, "upsert");
      },
    })
  );

  const editTask = useMutation(
    webClientORPC.tasks.editTask.mutationOptions({
      onSuccess: (result) => {
        onSuccess?.();
        applyTaskMutationResult(queryClient, result, "upsert");
      },
    })
  );

  const form = taskAppForm({
    defaultValues: {
      description: existingTask?.task.description ?? "",
      urgent: existingTask?.task.urgent ?? false,
      supervisorNeeded: existingTask?.task.supervisorNeeded ?? false,
      visibleAt: existingTask?.task.visibleAt ? existingTask.task.visibleAt : undefined,
      completeBy: existingTask?.task.completeBy ? existingTask.task.completeBy : undefined,
      completion: existingTask?.completion ? { comment: existingTask.completion.comment } : undefined,
      createdBy: existingTask?.createdBy,
    } as TaskFormValues,
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
          <p className="mt-2 text-[14px] text-sm uppercase tracking-widest">{thisRoom?.displayName}</p>
        </DialogTitle>
      </DialogHeader>

      {/* SCROLL ONLY WRAPS BODY */}
      <ScrollArea className="max-h-[calc(100dvh-300px)] rounded-2xl bg-background/40 p-3">
        <TaskFormFields form={form} existingTask={existingTask} />
      </ScrollArea>

      <DialogFooter className="my-3">
        <div className="flex w-full items-center justify-between">
          <div>
            {existingTask && (
              <DeleteTaskDialog existingTask={existingTask}>
                <Button variant="ghost" className="bg-red-500/10 text-red-500 hover:bg-red-600/10 hover:text-red-600">
                  <Trash2 className="size-4" />
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
