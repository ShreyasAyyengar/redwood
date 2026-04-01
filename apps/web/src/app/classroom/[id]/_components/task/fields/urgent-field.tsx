import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { Field, FieldError, FieldLabel } from "@redwood/shad-ui/components/field";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useEffect, useState } from "react";
import { urgencyStyle } from "../../../../../../util/style-util";
import { type FormValues, useFieldContext } from "../task-form";

export default function UrgentField({ existingValue }: { existingValue?: boolean }) {
  const field = useFieldContext<FormValues["urgent"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const [value, setValue] = useState<boolean>(existingValue ?? false);

  useEffect(() => {
    field.handleChange(value);
  }, [value]);

  return (
    <Field data-invalid={isInvalid}>
      <div className="flex items-center space-x-3">
        <Checkbox
          className="h-5 w-5 border border-neutral-400"
          checked={value}
          onCheckedChange={(checked) => setValue(checked.valueOf() as boolean)}
        />
        <FieldLabel
          htmlFor={field.name}
          className={cn("rounded-lg bg-zinc-800 px-2 text-lg transition-all duration-150", value && urgencyStyle("red"))}
        >
          Urgent
        </FieldLabel>
      </div>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
