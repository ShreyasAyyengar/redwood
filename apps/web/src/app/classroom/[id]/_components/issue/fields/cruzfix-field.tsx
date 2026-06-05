import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { Input } from "@redwood/shad-ui/components/input";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useState } from "react";
import { type IssueFormValues, useFieldContext } from "../issue-form-context";

export default function CruzfixField({ existingValue }: { existingValue?: string }) {
  const field = useFieldContext<IssueFormValues["cruzfixId"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const [checked, setChecked] = useState<boolean>(!!existingValue);
  const [cruzfixId, setCruzfixId] = useState<string | undefined>(existingValue ?? field.state.value ?? undefined);

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        className="h-5 w-5 border border-neutral-400"
        checked={checked}
        onCheckedChange={(checked) => {
          const nextChecked = checked === true;
          setChecked(nextChecked);
          if (!nextChecked) {
            setCruzfixId(undefined);
            field.handleChange(undefined);
          }
        }}
      />
      <div className="flex flex-col">
        <span className={cn("mb-1", checked ? "text-neutral-300" : "text-neutral-500")}>CruzFix ID:</span>
        <Input
          type="text"
          placeholder="Enter CruzFix ID"
          value={cruzfixId ?? ""}
          onChange={(e) => {
            const next = e.target.value;
            setCruzfixId(next);
            field.handleChange(next);
          }}
          className={`rounded border px-2 py-1 ${isInvalid ? "border-red-500" : ""}`}
          disabled={!checked}
        />
      </div>
    </div>
  );
}
