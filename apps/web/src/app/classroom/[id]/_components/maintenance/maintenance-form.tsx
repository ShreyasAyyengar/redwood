import type { classroomSchema, maintenanceEntrySchema, maintenanceFormSchema } from "@redwood/contracts";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import type { z } from "zod";
import { webClientORPC } from "../../../../../lib/orpc-web-client";
import { useFetchedRoomsStore } from "../../../../_components/room-store";

export type FormValues = z.input<typeof maintenanceFormSchema>;
export const { fieldContext, formContext, useFieldContext } = createFormHookContexts();
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    // DateField,
    // DTENField,
    // GreenStripeField,
    // SurfacesWipedField,
    // EquipmentCheckedField,
  },
  formComponents: {},
});

export default function MaintenanceForm({
  room,
  maintenanceEntry,
}: {
  room: z.infer<typeof classroomSchema>;
  maintenanceEntry?: z.infer<typeof maintenanceEntrySchema>;
}) {
  const { updateRoom } = useFetchedRoomsStore();
  const createMaintenanceLog = useMutation(
    webClientORPC.maintenance.addMaintenanceEntry.mutationOptions({
      onSuccess: (data) => updateRoom(room._id),
    })
  );

  return <div />;
}
