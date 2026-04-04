import { maintenanceFormSchema } from "@redwood/contracts";
import { Field, FieldError } from "@redwood/shad-ui/components/field";
import { Label } from "@redwood/shad-ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@redwood/shad-ui/components/select";
import { Separator } from "@redwood/shad-ui/components/separator";
import { Switch } from "@redwood/shad-ui/components/switch";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { type FormValues, useFieldContext } from "../maintenance-form";

export default function MicrophoneField({ existingValues }: { existingValues?: z.infer<typeof maintenanceFormSchema>["microphone"] }) {
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
  const [batteryStripe, setBatteryStripe] = useState<BatteryStripe>(existingValues?.batteryStripe ?? "");
  const [chargerStripe, setChargerStripe] = useState<ChargerStripe>(existingValues?.chargerStripe ?? "");
  const [transmitterStripe, setTransmitterStripe] = useState<TransmitterStripe>(existingValues?.transmitterStripe ?? "");
  const [aldBatteriesCharged, setAldBatteriesCharged] = useState<AldBatteriesCharged>(existingValues?.aldBatteriesCharged ?? "");
  const [windscreenSecure, setWindscreenSecure] = useState<WindscreenSecure>(existingValues?.windscreenSecure ?? "");
  const [clipInstalled, setClipInstalled] = useState<ClipInstalled>(existingValues?.clipInstalled ?? "");

  useEffect(() => {
    if (!equipped) field.handleChange(undefined);
    else field.handleChange({ batteryStripe, chargerStripe, transmitterStripe, aldBatteriesCharged, windscreenSecure, clipInstalled });
  }, [equipped, batteryStripe, chargerStripe, transmitterStripe, aldBatteriesCharged]);

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
                      onValueChange={(value) => setBatteryStripe(value as BatteryStripe)}
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
                      onValueChange={(value) => setChargerStripe(value as ChargerStripe)}
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
                      onValueChange={(value) => setTransmitterStripe(value as TransmitterStripe)}
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
                  onValueChange={(value) => setAldBatteriesCharged(value as AldBatteriesCharged)}
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
                  onValueChange={(value) => setWindscreenSecure(value as WindscreenSecure)}
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

                <Select value={clipInstalled} onValueChange={(value) => setClipInstalled(value as ClipInstalled)} disabled={!!existingValues}>
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
