import { Button } from "@redwood/shad-ui/components/button";
import { Calendar } from "@redwood/shad-ui/components/calendar";
import { Field, FieldError, FieldLabel } from "@redwood/shad-ui/components/field";
import { Popover, PopoverContent, PopoverTrigger } from "@redwood/shad-ui/components/popover";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { type FormValues, useFieldContext } from "../maintenance-form";

export default function DateField({ maintenanceEntry }: { maintenanceEntry?: Date }) {
  const field = useFieldContext<FormValues["date"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const [date, setDate] = useState<Date | undefined>(maintenanceEntry ?? new Date());

  return (
    <Field data-invalid={isInvalid} className="w-fit">
      <FieldLabel htmlFor={field.name}>Date of Maintenance</FieldLabel>

      <Popover>
        <PopoverTrigger asChild className="border border-emerald-500" disabled={!!maintenanceEntry}>
          <Button
            variant="outline"
            data-empty={!date}
            className="justify-center text-left font-normal data-[empty=true]:text-muted-foreground"
            disabled={!!maintenanceEntry}
          >
            {date ? <span>{date.toLocaleDateString()}</span> : <span>Pick a date</span>}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={setDate} defaultMonth={date} disabled={!!maintenanceEntry} />
        </PopoverContent>
      </Popover>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
