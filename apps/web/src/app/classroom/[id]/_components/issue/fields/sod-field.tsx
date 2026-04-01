import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { Input } from "@redwood/shad-ui/components/input";
import { useEffect, useState } from "react";
import { type FormValues, useFieldContext } from "../issue-form";

export default function SodIDField({ existingValue }: { existingValue?: string }) {
  const field = useFieldContext<FormValues["issue"]["sodId"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const [checked, setChecked] = useState<boolean>(!!existingValue);
  const [sodId, setSodId] = useState<string | undefined>(existingValue ?? field.state.value ?? undefined);

  useEffect(() => {
    field.handleChange(sodId);
    if (checked && existingValue) setSodId(existingValue);
  }, [checked, sodId]);

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        className="h-5 w-5 border border-neutral-400"
        checked={checked}
        onCheckedChange={(checked) => {
          setChecked(checked.valueOf() as boolean);
          if (!checked) setSodId(undefined);
        }}
      />
      <Input
        type="text"
        placeholder="Enter SOD Id"
        value={sodId ?? ""}
        onChange={(e) => setSodId(e.target.value)}
        className={`rounded border px-2 py-1 ${isInvalid ? "border-red-500" : ""}`}
        disabled={!checked}
      />
    </div>
  );
}
