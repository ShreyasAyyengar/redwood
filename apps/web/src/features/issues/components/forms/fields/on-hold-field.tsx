import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import type { IssueFormValues } from "../issue-form-context";
import { useFieldContext } from "../issue-form-context";

export default function OnHoldField({ onPlaceOnHold }: { onPlaceOnHold: () => void }) {
  const field = useFieldContext<IssueFormValues["onHold"]>();
  const id = "issue-on-hold";

  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2">
      <Checkbox
        id={id}
        className="h-5 w-5 border border-neutral-400"
        checked={Boolean(field.state.value)}
        onCheckedChange={(checked) => {
          const next = checked === true;
          field.handleChange(next);
          if (next) onPlaceOnHold();
        }}
      />
      <span>Place on Hold</span>
    </label>
  );
}
