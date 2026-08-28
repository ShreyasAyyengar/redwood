import type { FieldError } from "@redwood/shad-ui/components/field";
import { Textarea } from "@redwood/shad-ui/components/textarea";
import type { ComponentProps } from "react";
import { InlineField } from "./inline-field.tsx";

type EntryTextareaCellProps = {
  errors: ComponentProps<typeof FieldError>["errors"];
  flexible?: boolean;
  invalid: boolean;
  label: string;
  onBlur: () => void;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
  width: number;
};

export function EntryTextareaCell({ errors, flexible, invalid, label, onBlur, onChange, placeholder, value, width }: EntryTextareaCellProps) {
  return (
    <InlineField width={width} invalid={invalid} errors={errors} flexible={flexible}>
      <Textarea
        aria-label={label}
        aria-invalid={invalid}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-28 resize-none border-zinc-700 bg-zinc-900/80 text-left text-xs"
      />
    </InlineField>
  );
}
