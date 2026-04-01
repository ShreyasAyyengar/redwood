import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { Field, FieldError } from "@redwood/shad-ui/components/field";
import { Textarea } from "@redwood/shad-ui/components/textarea";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useEffect, useState } from "react";
import { type FormValues, useFieldContext } from "../task-form";

export default function CompletionField({ existingValue }: { existingValue?: string }) {
  const field = useFieldContext<FormValues["completion"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const [localValue, setLocalValue] = useState(existingValue ?? field.state.value?.comment ?? "");
  const [completing, setCompleting] = useState(Boolean(existingValue ?? field.state.value?.comment));

  useEffect(() => {
    if (existingValue) field.handleChange({ comment: existingValue });
  }, [existingValue]);

  useEffect(() => {
    if (!completing) {
      setLocalValue("");
      field.handleChange(undefined);
    } else {
      field.handleChange({ comment: localValue });
    }
  }, [completing]);

  return (
    <>
      <div className={cn("flex items-center gap-2")}>
        <Checkbox
          className="h-5 w-5 border border-neutral-400"
          checked={completing}
          onCheckedChange={(checked) => {
            const next = checked === true;
            setCompleting(next);
          }}
        />
        <span>Mark as Completed</span>
      </div>

      {completing && (
        <Field data-invalid={isInvalid}>
          <div className="flex flex-col space-y-1">
            <Textarea
              className="border border-white/30 bg-zinc-950/30 p-3 text-lg"
              placeholder="Describe completion (optional)..."
              value={localValue}
              onChange={(e) => {
                const next = e.target.value;
                setLocalValue(next);
                field.handleChange({ comment: next });
              }}
            />
          </div>

          {isInvalid && <FieldError errors={field.state.meta.errors} />}
        </Field>
      )}
    </>
  );
}
