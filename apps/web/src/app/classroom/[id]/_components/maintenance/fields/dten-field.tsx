import { maintenanceFormSchema } from "@redwood/contracts";
import { Field, FieldError } from "@redwood/shad-ui/components/field";
import { Label } from "@redwood/shad-ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@redwood/shad-ui/components/select";
import { Switch } from "@redwood/shad-ui/components/switch";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { type FormValues, useFieldContext } from "../maintenance-form";

export default function DTENField({ existingValue }: { existingValue?: z.infer<typeof maintenanceFormSchema>["dten"] }) {
  const field = useFieldContext<FormValues["dten"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

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
    if (!equipped) field.handleChange(undefined);
    else field.handleChange({ licenced, signPresent, microphoneWorking, speakerWorking, screenWiped });
  }, [equipped, licenced, signPresent, microphoneWorking, speakerWorking, screenWiped]);

  return (
    <Field data-invalid={isInvalid}>
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <Label htmlFor="dten-equipped" className="font-semibold text-lg">
            Is Room DTEN Equipped?
          </Label>
          <Switch
            id="dten-equipped"
            className="data-[state=checked]:bg-zinc-400"
            checked={equipped}
            onCheckedChange={(checked) => setEquipped(checked.valueOf() as boolean)}
          />
          {isInvalid && <span className="text-red-500">Invalid</span>}
        </div>

        {equipped && (
          <div className="flex flex-col -space-y-4">
            <div className="mt-5 mr-3 flex">
              <div className="flex w-full items-center justify-between gap-2">
                <span>Licensed: </span>

                <Select value={licenced} onValueChange={(value) => setLicenced(value as LicencedSchema)}>
                  <SelectTrigger className="w-fit border border-white/30 bg-zinc-950/30">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(licensedSchema.enum).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-5 mr-3 flex">
              <div className="flex w-full items-center justify-between gap-2">
                <span>Sign Present: </span>

                <Select value={signPresent} onValueChange={(value) => setSignPresent(value as SignPresentSchema)}>
                  <SelectTrigger className="w-fit border border-white/30 bg-zinc-950/30">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(signPresentSchema.enum).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-5 mr-3 flex">
              <div className="flex w-full items-center justify-between gap-2">
                <span>Microphone Working: </span>

                <Select value={microphoneWorking} onValueChange={(value) => setMicrophoneWorking(value as MicrophoneWorkingSchema)}>
                  <SelectTrigger className="w-fit border border-white/30 bg-zinc-950/30">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(microphoneWorkingSchema.enum).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-5 mr-3 flex">
              <div className="flex w-full items-center justify-between gap-2">
                <span>Speaker Working: </span>

                <Select value={speakerWorking} onValueChange={(value) => setSpeakerWorking(value as SpeakerWorkingSchema)}>
                  <SelectTrigger className="w-fit border border-white/30 bg-zinc-950/30">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(speakerWorkingSchema.enum).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-5 mr-3 flex">
              <div className="flex w-full items-center justify-between gap-2">
                <span>Screen Wiped: </span>

                <Select value={screenWiped} onValueChange={(value) => setScreenWiped(value as ScreenWipedSchema)}>
                  <SelectTrigger className="w-fit border border-white/30 bg-zinc-950/30">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(screenWipedSchema.enum).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
