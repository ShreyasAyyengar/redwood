import type { maintenanceEntrySchema } from "@redwood/contracts";
import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { Field, FieldError, FieldLabel } from "@redwood/shad-ui/components/field";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@redwood/shad-ui/components/hover-card";
import { cn } from "@redwood/shad-ui/lib/utils";
import { CircleQuestionMark } from "lucide-react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { urgencyStyle } from "../../../../../../util/style-util";
import { type FormValues, useFieldContext } from "../maintenance-form";

export default function EquipmentCheckedField({ existingEntry }: { existingEntry?: z.infer<typeof maintenanceEntrySchema> }) {
  const field = useFieldContext<FormValues["equipmentChecked"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const [value, setValue] = useState<boolean | undefined>(existingEntry?.equipmentChecked ?? false);

  useEffect(() => {
    field.handleChange(value as boolean);
  }, [value]);

  return (
    <Field data-invalid={isInvalid}>
      <div className="flex items-center space-x-3">
        <div className="flex items-center gap-1">
          <FieldLabel
            htmlFor={field.name}
            className={cn("rounded-lg bg-zinc-800 px-2 text-lg transition-all duration-150", value && urgencyStyle("green"))}
          >
            Equipment Checked / QC'd
          </FieldLabel>
          <HoverCard openDelay={500} closeDelay={50}>
            <HoverCardTrigger asChild>
              <CircleQuestionMark className="h-4 w-4 text-neutral-400" />
            </HoverCardTrigger>
            <HoverCardContent className="flex w-64 flex-col justify-center gap-0.5 text-sm">
              <div>Ensure that all equipment used for instruction is in good working order, and quality controlled by standards set:</div>
              <a className="text-blue-300 underline" href="https://canvas.ucsc.edu/courses/90027/pages/qc-hdmi" target="_blank" rel="noopener">
                QC: HDMI
              </a>
              <a
                className="text-blue-300 underline"
                href="https://canvas.ucsc.edu/courses/90027/pages/qc-wireless-projection"
                target="_blank"
                rel="noopener"
              >
                QC: Wireless Projection
              </a>
              <a
                className="text-blue-300 underline"
                href="https://canvas.ucsc.edu/courses/90027/pages/qc-document-camera"
                target="_blank"
                rel="noopener"
              >
                QC: Document Camera
              </a>
              <a
                className="text-blue-300 underline"
                href="https://canvas.ucsc.edu/courses/90027/pages/qc-ethernet"
                target="_blank"
                rel="noopener"
              >
                QC: Ethernet
              </a>
            </HoverCardContent>
          </HoverCard>
        </div>
        <Checkbox
          className="h-5 w-5"
          checked={value}
          disabled={!!existingEntry}
          onCheckedChange={(checked) => setValue(checked.valueOf() as boolean)}
        />
      </div>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
