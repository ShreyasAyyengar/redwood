import { api } from "@backend/convex/_generated/api";
import type { Doc, Id } from "@backend/convex/_generated/dataModel";
import { Button } from "@redwood/shad-ui/components/button";
import { DialogClose, DialogFooter, DialogHeader, DialogTitle } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Trash2 } from "lucide-react";
import { authClientWeb } from "#/lib/auth-client-web.ts";
import { hasAdminAccess } from "#/lib/permissions.ts";
import { getTaskFormValues, serializeTaskFormValues, taskFormSchema } from "../../model/task-form-schema";
import { optimisticallyCreateTask, optimisticallyEditTask } from "../../model/task-optimistic-updates";
import { DeleteTaskDialog } from "../dialogs/delete-task-dialog";
import { type TaskFormValues, taskAppForm } from "./task-form-context";
import { TaskFormFields } from "./task-form-fields";

export type FormValues = TaskFormValues;

export function TaskForm({
  roomId,
  existingTask,
  onSuccess,
}: {
  roomId: Id<"classrooms">;
  existingTask?: Doc<"tasks">;
  onSuccess?: () => void;
}) {
  const thisRoom = useQuery(api.core.classrooms.service.getRoom, { id: roomId });
  const { data: session } = authClientWeb.useSession();
  const currentUserEmail = session?.user.email;
  const isAdmin = hasAdminAccess(session?.user.role);

  const createTask = useMutation(api.core.tasks.service.addTask).withOptimisticUpdate((localStore, args) => {
    if (!currentUserEmail) return;
    optimisticallyCreateTask(localStore, args, { email: currentUserEmail, isAdmin, roomGroupKey: thisRoom?.groupKey });
  });
  const editTask = useMutation(api.core.tasks.service.editTask).withOptimisticUpdate((localStore, args) => {
    if (!existingTask || !currentUserEmail) return;
    optimisticallyEditTask(localStore, args, existingTask, { email: currentUserEmail, isAdmin, roomGroupKey: thisRoom?.groupKey });
  });

  const form = taskAppForm({
    defaultValues: getTaskFormValues(existingTask),
    validators: {
      onChange: taskFormSchema,
    },
    onSubmit: async ({ value }: { value: TaskFormValues }) => {
      onSuccess?.();

      const serializedValue = serializeTaskFormValues(value);
      if (existingTask) {
        await editTask({
          ...serializedValue,
          _id: existingTask._id,
        });
      } else {
        await createTask({
          ...serializedValue,
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
            <>
              <form.AppField name="createdBy">
                {(field) => <field.CreatedByFieldSelector existingValue={existingTask.task.createdBy} />}
              </form.AppField>
              <form.AppField name="createdAt">
                {(field) => <field.CreatedAtField existingDate={new Date(existingTask.task.createdAt)} />}
              </form.AppField>
            </>
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
              <DeleteTaskDialog existingTask={existingTask} onDeleted={onSuccess}>
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

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting, state.isDefaultValue]}>
              {([canSubmit, isSubmitting, isDefaultValue]) => (
                <Button
                  className={cn(
                    `${canSubmit ? "bg-foreground hover:cursor-pointer hover:bg-foreground/50" : "cursor-not-allowed hover:bg-accent"}`,
                    `${isSubmitting ? "cursor-wait" : "cursor-default"}`
                  )}
                  onClick={form.handleSubmit}
                  disabled={!canSubmit || (existingTask && isDefaultValue) || isSubmitting}
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
