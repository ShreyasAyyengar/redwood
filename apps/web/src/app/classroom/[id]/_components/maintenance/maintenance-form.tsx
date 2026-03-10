import { type classroomSchema, type maintenanceEntrySchema, maintenanceFormSchema } from "@redwood/contracts";
import { Separator } from "@redwood/shad-ui/components/separator";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import type { z } from "zod";
import { webClientORPC } from "../../../../../lib/orpc-web-client";
import { useFetchedRoomsStore } from "../../../../_components/room-store";
import DateField from "./fields/date-field";
import EquipmentCheckedField from "./fields/equipment-checked";
import MicrophoneField from "./fields/microphone-field";
import SurfacesWipedField from "./fields/surfaces-wiped";

export type FormValues = z.input<typeof maintenanceFormSchema>;
export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    DateField,
    // DTENField,
    GreenStripeField: MicrophoneField,
    SurfacesWipedField,
    EquipmentCheckedField,
  },
  formComponents: {},
});

export default function MaintenanceForm({
  roomId,
  maintenanceEntry,
}: {
  roomId: z.infer<typeof classroomSchema>["_id"];
  maintenanceEntry?: z.infer<typeof maintenanceEntrySchema>;
}) {
  const { updateRoom } = useFetchedRoomsStore();
  const createMaintenanceLog = useMutation(
    webClientORPC.maintenance.addMaintenanceEntry.mutationOptions({
      onSuccess: (data) => updateRoom(roomId),
    })
  );

  const form = useAppForm({
    defaultValues: {} as FormValues,
    validators: {
      onChange: maintenanceFormSchema,
    },
    onSubmit: async ({ value }) => {
      await createMaintenanceLog.mutateAsync({
        ...value,
        classroomId: roomId,
        date: value.date ?? new Date(),
      });
    },
  });

  return (
    <div>
      <div className="flex h-fit flex-col gap-5">
        {/* Date */}
        <form.AppField name="date">{(field) => <field.DateField existingDate={maintenanceEntry?.date} />}</form.AppField>
        <Separator className="bg-amber-500" />
        <form.AppField name="greenStripe">{(field) => <field.GreenStripeField existingValues={maintenanceEntry?.greenStripe} />}</form.AppField>

        <Separator className="bg-amber-500" />

        {/*/!* General Maintenance *!/*/}
        {/*<div className="flex flex-col items-end">*/}
        {/*  <div className="h-full justify-center space-y-3 rounded-md bg-zinc-950/30 p-3 ring-1 ring-white/15">*/}
        {/*    <form.AppField name="surfacesWiped">*/}
        {/*      {(field) => <field.SurfacesWipedField existingValue={maintenanceEntry?.surfacesWiped} />}*/}
        {/*    </form.AppField>*/}
        {/*    <form.AppField name="equipmentChecked">*/}
        {/*      {(field) => <field.EquipmentCheckedField existingValue={maintenanceEntry?.equipmentChecked} />}*/}
        {/*    </form.AppField>*/}
        {/*  </div>*/}
        {/*</div>*/}
      </div>
    </div>
  );
}
