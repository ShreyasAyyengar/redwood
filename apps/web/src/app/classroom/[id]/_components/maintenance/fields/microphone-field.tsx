import type { maintenanceFormSchema } from "@redwood/contracts";
import { Checkbox } from "@redwood/shad-ui/components/checkbox";
import { Label } from "@redwood/shad-ui/components/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@redwood/shad-ui/components/select";
import { Separator } from "@redwood/shad-ui/components/separator";
import { Switch } from "@redwood/shad-ui/components/switch";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { type FormValues, useFieldContext } from "../maintenance-form";

export default function MicrophoneField({ existingValues }: { existingValues?: z.infer<typeof maintenanceFormSchema>["microphone"] }) {
  const field = useFieldContext<FormValues["microphone"]>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const batteryStripeSchema = maintenanceFormSchema.shape.microphone.unwrap().shape.batteryStripe;
  const chargerStripeSchema = maintenanceFormSchema.shape.microphone.unwrap().shape.chargerStripe;
  const transmitterStripeSchema = maintenanceFormSchema.shape.microphone.unwrap().shape.transmitterStripe;
  const aldBatteriesChargedSchema = maintenanceFormSchema.shape.microphone.unwrap().shape.aldBatteriesCharged;

  type BatteryStripe = z.infer<typeof batteryStripeSchema>;
  type ChargerStripe = z.infer<typeof chargerStripeSchema>;
  type TransmitterStripe = z.infer<typeof transmitterStripeSchema>;
  type AldBatteriesCharged = z.infer<typeof aldBatteriesChargedSchema>;

  const [equipped, setEquipped] = useState<boolean>(false);
  const [batteryStripe, setBatteryStripe] = useState<BatteryStripe>("");
  const [chargerStripe, setChargerStripe] = useState<ChargerStripe>("");
  const [transmitterStripe, setTransmitterStripe] = useState<TransmitterStripe>("");
  const [aldBatteriesCharged, setAldBatteriesCharged] = useState<AldBatteriesCharged>("");

  useEffect(() => {
    field.handleChange({ transmitter, charger, battery });
  }, [transmitter, charger, battery]);

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-3">
        <Label htmlFor="microphone-equipped" className="font-semibold text-lg">
          Is Room Microphone Equipped?
        </Label>
        <Switch
          id="microphone-equipped"
          className="data-[state=checked]:bg-amber-500"
          checked={equipped}
          onCheckedChange={(checked) => setEquipped(checked.valueOf() as boolean)}
        />
      </div>

      {equipped && (
        <div className="flex gap-4">
          <Separator className="ml-3 h-45! w-0.5! bg-amber-500" orientation="vertical" />
          <div>
            <span>Painted Green Stripe Applied:</span>
            <div className="ml-4 flex flex-col items-start space-y-1">
              <div className="flex items-center gap-2">
                <span>Battery: </span>

                <Select>
                  <SelectTrigger className="w-full max-w-48">
                    <SelectValue placeholder="Select a fruit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="apple">Apple</SelectItem>
                      <SelectItem value="banana">Banana</SelectItem>
                      <SelectItem value="blueberry">Blueberry</SelectItem>
                      <SelectItem value="grapes">Grapes</SelectItem>
                      <SelectItem value="pineapple">Pineapple</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span>Charger: </span>
                <Checkbox
                  checked={charger}
                  disabled={!!existingValues}
                  onCheckedChange={(checked) => setCharger(checked.valueOf() as boolean)}
                />
              </div>

              <div className="flex items-center gap-2">
                <span>Transmitter: </span>
                <Checkbox
                  checked={transmitter}
                  disabled={!!existingValues}
                  onCheckedChange={(checked) => setTransmitter(checked.valueOf() as boolean)}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // return (
  //   <div>
  //     Room Microphone Equipped?
  //     <Field
  //       data-invalid={isInvalid}
  //       className={cn("max-h-full w-fit rounded-md bg-zinc-950/30 p-3 ring-1 ring-white/15", existingValues && "cursor-not-allowed")}
  //     >
  //       <div className="flex flex-col items-start justify-start space-x-3">
  //         <FieldLabel className="text-xl" htmlFor={field.name}>
  //           Painted Green Stripe Visible:
  //         </FieldLabel>
  //
  //         <span>Transmitter: </span>
  //         <Checkbox
  //           checked={transmitter}
  //           disabled={!!existingValues}
  //           onCheckedChange={(checked) => setTransmitter(checked.valueOf() as boolean)}
  //         />
  //         <span>Charger: </span>
  //         <Checkbox checked={charger} disabled={!!existingValues} onCheckedChange={(checked) => setCharger(checked.valueOf() as boolean)} />
  //         <span>Battery: </span>
  //         <Checkbox checked={battery} disabled={!!existingValues} onCheckedChange={(checked) => setBattery(checked.valueOf() as boolean)} />
  //       </div>
  //
  //       {isInvalid && <FieldError errors={field.state.meta.errors} />}
  //     </Field>
  //   </div>
  // );
}
