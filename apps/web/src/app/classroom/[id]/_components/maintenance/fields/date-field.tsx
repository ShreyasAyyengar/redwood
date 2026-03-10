import { Button } from "@redwood/shad-ui/components/button";
import { Calendar } from "@redwood/shad-ui/components/calendar";
import { Field, FieldError, FieldLabel } from "@redwood/shad-ui/components/field";
import { Popover, PopoverContent, PopoverTrigger } from "@redwood/shad-ui/components/popover";
import { CalendarDays, ChevronDownIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { type FormValues, useFieldContext } from "../maintenance-form";

export default function DateField({ existingDate }: { existingDate?: Date }) {
  const field = useFieldContext<FormValues["date"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const [date, setDate] = useState<Date | undefined>(existingDate ?? new Date());

  useEffect(() => {
    field.handleChange(date);
  }, [date]);

  return (
    <Field data-invalid={isInvalid}>
      <div className="flex flex-col space-y-1">
        <FieldLabel htmlFor={field.name} className="font-semibold text-lg">
          Date of Maintenance:
        </FieldLabel>

        <Popover>
          <PopoverTrigger asChild disabled={!!existingDate} className="border border-white/30 bg-zinc-950/30 p-5">
            <Button
              variant="outline"
              data-empty={!date}
              className="max-w-fit text-lg data-[empty=true]:text-muted-foreground"
              disabled={!!existingDate}
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="h-6! w-6!" />
                {date ? <span>{date.toLocaleDateString()}</span> : <span>Pick a date</span>}
              </div>
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={setDate} defaultMonth={date} disabled={!!existingDate} />
          </PopoverContent>
        </Popover>
      </div>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
