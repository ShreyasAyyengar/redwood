import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { Input } from "@redwood/shad-ui/components/input";
import { useEffect, useState } from "react";
import { type FormValues, useFieldContext } from "../issue-form";

export default function CruzfixField({ existingValue }: { existingValue?: string }) {
  const field = useFieldContext<FormValues["issue"]["cruzfixId"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const [checked, setChecked] = useState<boolean>(!!existingValue);
  const [cruzfixId, setCruzfixId] = useState<string | undefined>(existingValue ?? field.state.value ?? undefined);

  useEffect(() => {
    field.handleChange(cruzfixId);
    if (checked && existingValue) setCruzfixId(existingValue);
  }, [checked, cruzfixId]);

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        className="h-5 w-5 border border-neutral-400"
        checked={checked}
        onCheckedChange={(checked) => {
          setChecked(checked.valueOf() as boolean);
          if (!checked) setCruzfixId(undefined);
        }}
      />
      <Input
        type="text"
        placeholder="Enter Cruzfix Id"
        value={cruzfixId ?? ""}
        onChange={(e) => setCruzfixId(e.target.value)}
        className={`rounded border px-2 py-1 ${isInvalid ? "border-red-500" : ""}`}
        disabled={!checked}
      />
    </div>
  );
}
