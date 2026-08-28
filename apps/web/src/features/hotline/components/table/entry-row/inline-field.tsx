import { FieldError } from "@redwood/shad-ui/components/field";
import { cn } from "@redwood/shad-ui/lib/utils";
import type { ComponentProps, ReactNode } from "react";

type InlineFieldProps = {
  children: ReactNode;
  className?: string;
  errors?: ComponentProps<typeof FieldError>["errors"];
  flexible?: boolean;
  invalid?: boolean;
  width: number;
};

export function InlineField({ children, className, errors, flexible = false, invalid = false, width }: InlineFieldProps) {
  return (
    <div
      data-invalid={invalid}
      className={cn(
        "relative flex flex-col justify-center gap-1.5 border-zinc-800/70 border-r px-2 py-2",
        flexible ? "min-w-0 shrink grow" : "shrink-0",
        className
      )}
      style={{ width }}
    >
      {children}
      {invalid && <FieldError errors={errors} className="text-[10px] leading-3" />}
    </div>
  );
}
