import { Field, FieldError, FieldLabel } from "@redwood/shad-ui/components/field";
import { Textarea } from "@redwood/shad-ui/components/textarea";
import { type TaskFormValues, useFieldContext } from "../task-form-context";

export default function DescriptionField({ existingValue }: { existingValue?: string }) {
  const field = useFieldContext<TaskFormValues["description"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <div className="flex flex-col space-y-1">
        <FieldLabel htmlFor={field.name} className="font-semibold text-lg">
          Description:
        </FieldLabel>
        <Textarea
          className="border border-white/30 bg-zinc-950/30 p-3 text-lg"
          placeholder="Task description..."
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
        />
      </div>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
