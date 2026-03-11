import { type classroomSchema, type maintenanceEntrySchema, maintenanceFormSchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { DialogClose, DialogFooter } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Separator } from "@redwood/shad-ui/components/separator";
import { cn } from "@redwood/shad-ui/lib/utils";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import type { z } from "zod";
import { webClientORPC } from "../../../../../lib/orpc-web-client";
import { useFetchedRoomsStore } from "../../../../_components/room-store";
import DateField from "./fields/date-field";
import DTENField from "./fields/dten-field";
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
    DTENField,
    MicrophoneField,
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
    <>
      <ScrollArea className="max-h-[calc(100dvh-300px)] rounded-2xl bg-background/40 p-3">
        {" "}
        <div className="my-2 flex flex-col gap-5 px-1">
          {/* Date */}
          <form.AppField name="date">{(field) => <field.DateField existingDate={maintenanceEntry?.date} />}</form.AppField>
          <Separator className="bg-indigo-500" />

          {/* Microphone */}
          <form.AppField name="microphone">{(field) => <field.MicrophoneField existingValues={maintenanceEntry?.microphone} />}</form.AppField>

          <Separator className="bg-indigo-500" />

          {/* DTEN */}
          <form.AppField name="dten">{(field) => <field.DTENField existingValue={maintenanceEntry?.dten} />}</form.AppField>

          <Separator className="bg-indigo-500" />

          {/* General Maintenance */}
          <div className="flex flex-col items-start">
            <h2 className="mb-3 font-semibold text-lg">General Maintenance</h2>
            <div className="w-full justify-center space-y-3 rounded-md bg-zinc-950/30 p-3 ring-1 ring-white/15">
              <form.AppField name="surfacesWiped">
                {(field) => <field.SurfacesWipedField existingValue={maintenanceEntry?.surfacesWiped} />}
              </form.AppField>
              <form.AppField name="equipmentChecked">
                {(field) => <field.EquipmentCheckedField existingValue={maintenanceEntry?.equipmentChecked} />}
              </form.AppField>
            </div>
          </div>
        </div>
      </ScrollArea>
      <DialogFooter className="my-3">
        <DialogClose asChild>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              className={cn(
                `${canSubmit ? "bg-foreground hover:cursor-pointer hover:bg-foreground/50" : "cursor-not-allowed hover:bg-accent"}`,
                `${isSubmitting ? "cursor-wait" : "cursor-default"}`
              )}
              onClick={form.handleSubmit}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Logging..." : "Log Maintenance"}
            </Button>
          )}
        </form.Subscribe>
      </DialogFooter>
    </>
  );
}
