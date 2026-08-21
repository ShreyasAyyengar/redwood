import { Field, FieldError, FieldLabel } from "@redwood/shad-ui/components/field";
import { Textarea } from "@redwood/shad-ui/components/textarea";
import { type FeedbackFormValues, useFieldContext } from "../feedback-form";

export function DescriptionField() {
  const field = useFieldContext<FeedbackFormValues["description"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Field data-invalid={isInvalid}>
      <div className="flex flex-col space-y-1">
        <FieldLabel htmlFor={field.name} className="font-semibold text-lg">
          Description:
        </FieldLabel>
        <Textarea
          id={field.name}
          className="min-h-32 border border-white/30 bg-zinc-950/30 p-3 text-lg"
          placeholder="Describe your feedback..."
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(event) => field.handleChange(event.target.value)}
        />
      </div>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
