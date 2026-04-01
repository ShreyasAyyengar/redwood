import { Field, FieldError, FieldLabel } from "@redwood/shad-ui/components/field";
import { Textarea } from "@redwood/shad-ui/components/textarea";
import { useEffect, useState } from "react";
import { type FormValues, useFieldContext } from "../issue-form";

export default function DescriptionField({ existingValue }: { existingValue?: string }) {
  const field = useFieldContext<FormValues["description"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const [localValue, setLocalValue] = useState(existingValue ?? field.state.value);

  useEffect(() => {
    if (existingValue) field.handleChange(localValue); // force set field state if existingValue is provided
  }, []);

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
            value={localValue}
            onChange={(e) => {
              setLocalValue(e.target.value);
              field.handleChange(e.target.value);
            }}
            onFocus={(e) => e.target.setSelectionRange(-1, -1)}
          />
        </div>
      </div>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
