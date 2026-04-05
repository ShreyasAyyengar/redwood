import { maintenanceFormSchema } from "@redwood/contracts";
import { Field, FieldError } from "@redwood/shad-ui/components/field";
import { Label } from "@redwood/shad-ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@redwood/shad-ui/components/select";
import { Separator } from "@redwood/shad-ui/components/separator";
import { Switch } from "@redwood/shad-ui/components/switch";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { type FormValues, useFieldContext } from "../maintenance-form";

export default function MicrophoneField({
  existingValues,
  onTriggerAide,
}: {
  existingValues?: z.infer<typeof maintenanceFormSchema>["microphone"];
  onTriggerAide?: (type: "task" | "issue") => void;
}) {
  const field = useFieldContext<FormValues["microphone"]>();
  const isInvalid = !field.state.meta.isValid && field.state.meta.isTouched;

  const batteryStripeSchema = maintenanceFormSchema.shape.microphone.unwrap().shape.batteryStripe;
  const chargerStripeSchema = maintenanceFormSchema.shape.microphone.unwrap().shape.chargerStripe;
  const transmitterStripeSchema = maintenanceFormSchema.shape.microphone.unwrap().shape.transmitterStripe;
  const aldBatteriesChargedSchema = maintenanceFormSchema.shape.microphone.unwrap().shape.aldBatteriesCharged;
  const windscreenSecureSchema = maintenanceFormSchema.shape.microphone.unwrap().shape.windscreenSecure;
  const clipInstalledSchema = maintenanceFormSchema.shape.microphone.unwrap().shape.clipInstalled;

  type BatteryStripe = z.infer<typeof batteryStripeSchema>;
  type ChargerStripe = z.infer<typeof chargerStripeSchema>;
  type TransmitterStripe = z.infer<typeof transmitterStripeSchema>;
  type AldBatteriesCharged = z.infer<typeof aldBatteriesChargedSchema>;
  type WindscreenSecure = z.infer<typeof windscreenSecureSchema>;
  type ClipInstalled = z.infer<typeof clipInstalledSchema>;

  const [equipped, setEquipped] = useState<boolean>(!!existingValues);
  const [batteryStripe, setBatteryStripe] = useState<BatteryStripe>(existingValues?.batteryStripe ?? ("" as BatteryStripe));
  const [chargerStripe, setChargerStripe] = useState<ChargerStripe>(existingValues?.chargerStripe ?? ("" as ChargerStripe));
  const [transmitterStripe, setTransmitterStripe] = useState<TransmitterStripe>(existingValues?.transmitterStripe ?? ("" as TransmitterStripe));
  const [aldBatteriesCharged, setAldBatteriesCharged] = useState<AldBatteriesCharged>(
    existingValues?.aldBatteriesCharged ?? ("" as AldBatteriesCharged)
  );
  const [windscreenSecure, setWindscreenSecure] = useState<WindscreenSecure>(existingValues?.windscreenSecure ?? ("" as WindscreenSecure));
  const [clipInstalled, setClipInstalled] = useState<ClipInstalled>(existingValues?.clipInstalled ?? ("" as ClipInstalled));

  useEffect(() => {
    if (!equipped) field.handleChange(undefined);
    else field.handleChange({ batteryStripe, chargerStripe, transmitterStripe, aldBatteriesCharged, windscreenSecure, clipInstalled });
  }, [equipped, batteryStripe, chargerStripe, transmitterStripe, aldBatteriesCharged]);

  const handleValueChange = (
    value: BatteryStripe | ChargerStripe | TransmitterStripe | AldBatteriesCharged | WindscreenSecure | ClipInstalled,
    setter: (val: BatteryStripe | ChargerStripe | TransmitterStripe | AldBatteriesCharged | WindscreenSecure | ClipInstalled) => void
  ) => {
    setter(value);
    if (value === "No, task created for completion") onTriggerAide?.("task");
    else if (value === "No, issue preventing completion") onTriggerAide?.("issue");
  };

  return (
    <Field data-invalid={isInvalid}>
      <div className="flex flex-col">
        <div className="flex items-center gap-3">
          <Label htmlFor="microphone-equipped" className="font-semibold text-lg">
            Is Room Microphone Equipped?
          </Label>
          <Switch
            id="microphone-equipped"
            className="data-[state=checked]:bg-zinc-400"
            checked={equipped}
            onCheckedChange={(checked) => setEquipped(checked.valueOf() as boolean)}
            disabled={!!existingValues}
          />
          {isInvalid && <span className="text-red-500">Invalid</span>}
        </div>

        {equipped && (
          <>
            <div className="mt-3 flex w-full gap-4">
              <Separator className="ml-3 h-35! w-0.5! bg-zinc-500" orientation="vertical" />
              <div className="mr-3 w-full">
                <span>Painted Green Stripe Visible:</span>
                <div className="mt-1 ml-4 flex flex-col items-start">
                  <div className="flex w-full items-center justify-between gap-2">
                    <span>Battery: </span>

                    <Select
                      value={batteryStripe}
                      onValueChange={(value) => handleValueChange(value as BatteryStripe, (val) => setBatteryStripe(val as BatteryStripe))}
                      disabled={!!existingValues}
                    >
                      <SelectTrigger className="w-fit border border-white/30 bg-zinc-950/30">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(batteryStripeSchema.enum).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-1 ml-4 flex flex-col items-start">
                  <div className="flex w-full items-center justify-between gap-2">
                    <span>Charger: </span>

                    <Select
                      value={chargerStripe}
                      onValueChange={(value) => handleValueChange(value as ChargerStripe, (val) => setChargerStripe(val as ChargerStripe))}
                      disabled={!!existingValues}
                    >
                      <SelectTrigger className="w-fit border border-white/30 bg-zinc-950/30">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(chargerStripeSchema.enum).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-1 ml-4 flex flex-col items-start">
                  <div className="flex w-full items-center justify-between gap-2">
                    <span>Transmitter: </span>

                    <Select
                      value={transmitterStripe}
                      onValueChange={(value) =>
                        handleValueChange(value as TransmitterStripe, (val) => setTransmitterStripe(val as TransmitterStripe))
                      }
                      disabled={!!existingValues}
                    >
                      <SelectTrigger className="w-fit border border-white/30 bg-zinc-950/30">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(transmitterStripeSchema.enum).map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 mr-3 flex">
              <div className="flex w-full items-center justify-between gap-2">
                <span>ALD Batteries Charged: </span>

                <Select
                  value={aldBatteriesCharged}
                  onValueChange={(value) =>
                    handleValueChange(value as AldBatteriesCharged, (val) => setAldBatteriesCharged(val as AldBatteriesCharged))
                  }
                  disabled={!!existingValues}
                >
                  <SelectTrigger className="w-fit border border-white/30 bg-zinc-950/30">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(aldBatteriesChargedSchema.enum).map((status) => (
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
                <span>Windscreen Secure: </span>

                <Select
                  value={windscreenSecure}
                  onValueChange={(value) => handleValueChange(value as WindscreenSecure, (val) => setWindscreenSecure(val as WindscreenSecure))}
                  disabled={!!existingValues}
                >
                  <SelectTrigger className="w-fit border border-white/30 bg-zinc-950/30">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(windscreenSecureSchema.enum).map((status) => (
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
                <span>Microphone Clip Installed: </span>

                <Select
                  value={clipInstalled}
                  onValueChange={(value) => handleValueChange(value as ClipInstalled, (val) => setClipInstalled(val as ClipInstalled))}
                  disabled={!!existingValues}
                >
                  <SelectTrigger className="w-fit border border-white/30 bg-zinc-950/30">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(clipInstalledSchema.enum).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </div>

      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}
