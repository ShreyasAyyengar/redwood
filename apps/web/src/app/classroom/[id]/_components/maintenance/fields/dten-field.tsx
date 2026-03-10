import type { maintenanceFormSchema } from "@redwood/contracts";
import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { Field, FieldError, FieldLabel } from "@redwood/shad-ui/components/field";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { type FormValues, useFieldContext } from "../maintenance-form";

export default function DTENField({ existingValue }: { existingValue?: z.infer<typeof maintenanceFormSchema>["dten"] }) {
  const field = useFieldContext<FormValues["dten"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const [licenced, setLicenced] = useState<boolean>(existingValue?.licenced ?? false);
  const [signPresent, setSignPresent] = useState<boolean>(existingValue?.signPresent ?? false);
  const [microphoneWorking, setMicrophoneWorking] = useState<boolean>(existingValue?.microphoneWorking ?? false);
  const [speakerWorking, setSpeakerWorking] = useState<boolean>(existingValue?.speakerWorking ?? false);
  const [screenWiped, setScreenWiped] = useState<boolean>(existingValue?.screenWiped ?? false);

  useEffect(() => {
    field.handleChange({ licenced, signPresent, microphoneWorking, speakerWorking, screenWiped });
  }, [licenced, signPresent, microphoneWorking, speakerWorking, screenWiped]);

  return (
    <Field data-invalid={isInvalid}>
      <div className="flex items-center space-x-3">
        <FieldLabel htmlFor={field.name}>DTEN Applied</FieldLabel>
        <Checkbox checked={licenced} disabled={!!existingValue} onCheckedChange={(checked) => setLicenced(checked.valueOf() as boolean)} />
      </div>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
