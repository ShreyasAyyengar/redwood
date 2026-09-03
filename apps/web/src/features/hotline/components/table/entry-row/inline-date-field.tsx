import { Button } from "@redwood/shad-ui/components/button";
import { Calendar } from "@redwood/shad-ui/components/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@redwood/shad-ui/components/popover";
import { CalendarDays, ChevronDownIcon } from "lucide-react";
import { toDateTimeLocalValue } from "../../../model/hotline-form.ts";

export function InlineDateField({ onBlur, onChange, value }: { onBlur: () => void; onChange: (value: string) => void; value: string }) {
  const date = new Date(value);

  return (
    <Popover onOpenChange={(open) => !open && onBlur()}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-auto w-full justify-between border-zinc-700 bg-zinc-900/80 px-2 py-1.5 font-normal text-xs"
          aria-label="Date of call"
        >
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 text-sky-400" />
            <span className="flex flex-col items-start">
              <span>{date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              <span className="text-zinc-500">{date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
            </span>
          </span>
          <ChevronDownIcon className="size-3.5 text-zinc-500" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto border-zinc-700 bg-zinc-900 p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          onSelect={(selectedDate) => {
            if (!selectedDate) return;
            const nextDate = new Date(selectedDate);
            nextDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
            onChange(toDateTimeLocalValue(nextDate));
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
