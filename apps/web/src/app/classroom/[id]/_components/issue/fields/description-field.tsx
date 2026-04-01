import { Field, FieldError, FieldLabel } from "@redwood/shad-ui/components/field";
import { Textarea } from "@redwood/shad-ui/components/textarea";
import { type FormValues, useFieldContext } from "../issue-form";

export default function DescriptionField({ existingValue }: { existingValue?: string }) {
  const field = useFieldContext<FormValues["description"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <div className="flex flex-col space-y-1">
        <FieldLabel htmlFor={field.name} className="font-semibold text-lg">
          Description: {existingValue ? "(editable)" : ""}
        </FieldLabel>
        <div className="flex flex-col space-y-1">
          <Textarea
            className="border border-white/30 bg-zinc-950/30 p-3 text-lg"
            placeholder="Issue description..."
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onFocus={(e) => e.target.setSelectionRange(-1, -1)}
          />
        </div>
      </div>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
