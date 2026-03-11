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
  const licensedSchema = maintenanceFormSchema.shape.dten.unwrap().shape.licenced;
  const signPresentSchema = maintenanceFormSchema.shape.dten.unwrap().shape.signPresent;
  const microphoneWorkingSchema = maintenanceFormSchema.shape.dten.unwrap().shape.microphoneWorking;
  const speakerWorkingSchema = maintenanceFormSchema.shape.dten.unwrap().shape.speakerWorking;
  const screenWipedSchema = maintenanceFormSchema.shape.dten.unwrap().shape.screenWiped;

  type LicencedSchema = z.infer<typeof licensedSchema>;
  type SignPresentSchema = z.infer<typeof signPresentSchema>;
  type MicrophoneWorkingSchema = z.infer<typeof microphoneWorkingSchema>;
  type SpeakerWorkingSchema = z.infer<typeof speakerWorkingSchema>;
  type ScreenWipedSchema = z.infer<typeof screenWipedSchema>;

  const [equipped, setEquipped] = useState<boolean>(false);
  const [licenced, setLicenced] = useState<LicencedSchema>("");
  const [signPresent, setSignPresent] = useState<SignPresentSchema>("");
  const [microphoneWorking, setMicrophoneWorking] = useState<MicrophoneWorkingSchema>("");
  const [speakerWorking, setSpeakerWorking] = useState<SpeakerWorkingSchema>("");
  const [screenWiped, setScreenWiped] = useState<ScreenWipedSchema>("");

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
