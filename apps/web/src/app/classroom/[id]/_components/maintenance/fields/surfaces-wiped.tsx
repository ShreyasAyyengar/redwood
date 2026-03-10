import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { Field, FieldError, FieldLabel } from "@redwood/shad-ui/components/field";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@redwood/shad-ui/components/hover-card";
import { cn } from "@redwood/shad-ui/lib/utils";
import { CircleQuestionMark } from "lucide-react";
import { useEffect, useState } from "react";
import { type FormValues, useFieldContext } from "../maintenance-form";

export default function SurfacesWipedField({ existingValue }: { existingValue?: boolean }) {
  const field = useFieldContext<FormValues["surfacesWiped"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const [value, setValue] = useState<boolean | undefined>(existingValue ?? false);

  useEffect(() => {
    field.handleChange(value as boolean);
  }, [value]);

  return (
    <Field data-invalid={isInvalid}>
      <div className="flex items-center space-x-3">
        <div className="flex items-center gap-2">
          <FieldLabel htmlFor={field.name} className={cn("text-xl transition-all duration-150", value && "text-emerald-500")}>
            Surfaces Wiped
          </FieldLabel>
          <HoverCard openDelay={500} closeDelay={50}>
            <HoverCardTrigger asChild>
              <CircleQuestionMark className="h-4 w-4 text-neutral-400" />
            </HoverCardTrigger>
            <HoverCardContent className="flex w-64 flex-col justify-center gap-0.5 text-sm">
              <div>
                Ensure that all surfaces used for instruction are wiped down, and as dust-free as possible. This includes the document camera(s),
                lecturn(s), touch panel (if applicable), media cabinet, and any other surfaces used for instruction.
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>

        <Checkbox
          className={cn("h-5 w-5", value && "text-emerald-500")}
          checked={value}
          disabled={!!existingValue}
          onCheckedChange={(checked) => setValue(checked.valueOf() as boolean)}
        />
      </div>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
