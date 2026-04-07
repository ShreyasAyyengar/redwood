import { Button } from "@redwood/shad-ui/components/button";
import { Calendar } from "@redwood/shad-ui/components/calendar";
import { Field, FieldError, FieldLabel } from "@redwood/shad-ui/components/field";
import { Popover, PopoverContent, PopoverTrigger } from "@redwood/shad-ui/components/popover";
import { cn } from "@redwood/shad-ui/lib/utils";
import { CalendarDays, ChevronDownIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { authClientWeb } from "../../../../../../lib/auth-client-web";
import { useFieldContext } from "../issue-form";

export default function IssueDateField({ existingDate }: { existingDate: Date }) {
  const field = useFieldContext<Date>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const [date, setDate] = useState<Date | undefined>(existingDate);
  const { data: session } = authClientWeb.useSession();
  const isAdmin = session?.user.role === "admin";

  useEffect(() => {
    if (date) field.handleChange(date);
  }, [date]);

  return (
    <Field data-invalid={isInvalid}>
      <div className={cn("mt-5 flex gap-2", !isAdmin && "cursor-not-allowed")}>
        <FieldLabel htmlFor={field.name} className="font-semibold text-xl">
          Issue Date:
        </FieldLabel>

        <Popover>
          <PopoverTrigger asChild className="border border-white/30 bg-zinc-950/30" disabled={!isAdmin}>
            <Button variant="outline" data-empty={!date} className="max-w-fit text-lg data-[empty=true]:text-muted-foreground">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5! w-5!" />
                {date ? <span className="leading-none">{date.toLocaleDateString()}</span> : <span className="leading-none">Pick a date</span>}
                <ChevronDownIcon />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar mode="single" selected={date} onSelect={setDate} defaultMonth={date} />
          </PopoverContent>
        </Popover>
      </div>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
