import type { taskSchema } from "@redwood/contracts";
import { Separator } from "@redwood/shad-ui/components/separator";
import type { z } from "zod";
import type { TaskFormBodyApi } from "./task-form-context";

export function TaskFormFields({ form, existingTask }: { form: TaskFormBodyApi; existingTask?: z.infer<typeof taskSchema> }) {
  return (
    <div className="my-2 flex flex-col gap-5 px-1">
      <Separator className="bg-indigo-500" />

      <form.AppField name="description">{(field) => <field.DescriptionField existingValue={existingTask?.task.description} />}</form.AppField>

      <Separator className="bg-indigo-500" />

      <form.AppField name="urgent">{(field) => <field.UrgentField existingValue={existingTask?.task.urgent} />}</form.AppField>
      <form.AppField name="supervisorNeeded">
        {(field) => <field.SupervisorNeededField existingValue={existingTask?.task.supervisorNeeded} />}
      </form.AppField>
      <Separator className="bg-indigo-500" />

      <div className="mx-auto flex w-full flex-col justify-between space-y-5 sm:flex-row sm:space-y-0">
        <div>
          <form.AppField name="visibleAt">
            {(field) => (
              <field.TaskDateField
                label="Visible At"
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
  );
}
