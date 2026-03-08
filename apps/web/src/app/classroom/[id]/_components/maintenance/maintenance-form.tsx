import { type classroomSchema, type maintenanceEntrySchema, maintenanceFormSchema } from "@redwood/contracts";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import type { z } from "zod";
import { webClientORPC } from "../../../../../lib/orpc-web-client";
import { useFetchedRoomsStore } from "../../../../_components/room-store";
import DateField from "./fields/date-field";

export type FormValues = z.input<typeof maintenanceFormSchema>;
export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    DateField,
    // DTENField,
    // GreenStripeField,
    // SurfacesWipedField,
    // EquipmentCheckedField,
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
      <form.AppField name="date">{(field) => <field.DateField existingDate={maintenanceEntry?.date} />}</form.AppField>
    </div>
  );
}
