import { type classroomSchema, type maintenanceEntrySchema, maintenanceFormSchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { DialogClose, DialogFooter } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Separator } from "@redwood/shad-ui/components/separator";
import { cn } from "@redwood/shad-ui/lib/utils";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../../../lib/orpc-web-client";
import { IssueDialog } from "../issue/issue-dialog";
import { TaskDialog } from "../task/task-dialog";
import DateField from "./fields/date-field";
import DTENField from "./fields/dten-field";
import EquipmentCheckedField from "./fields/equipment-checked";
import MicrophoneField from "./fields/microphone-field";
import SurfacesWipedField from "./fields/surfaces-wiped";
import { MaintenanceAideDialog } from "./maintenance-aide-dialog";

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
  onSuccess,
}: {
  roomId: z.infer<typeof classroomSchema>["_id"];
  maintenanceEntry?: z.infer<typeof maintenanceEntrySchema>;
  onSuccess?: () => void;
}) {
  const [aideOpen, setAideOpen] = useState(false);
  const [aideType, setAideType] = useState<"task" | "issue" | null>(null);

  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [createIssueOpen, setCreateIssueOpen] = useState(false);

  const handleTriggerAide = (type: "task" | "issue") => {
    setAideType(type);
    setAideOpen(true);
  };

  const queryClient = useQueryClient();
  const createMaintenanceLog = useMutation(
    webClientORPC.maintenance.addMaintenanceEntry.mutationOptions({
      onSuccess: async (data) => {
        await queryClient.invalidateQueries({
          queryKey: webClientORPC.maintenance.getHistory.queryOptions({ input: { classroomId: roomId } }).queryKey,
        });
        onSuccess?.();
      },
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

  const microphoneSection =
    !maintenanceEntry || maintenanceEntry.microphone ? (
      <>
        <Separator className="bg-indigo-500" />
        <form.AppField name="microphone">
          {(field) => <field.MicrophoneField existingValues={maintenanceEntry?.microphone} onTriggerAide={handleTriggerAide} />}
        </form.AppField>
      </>
    ) : null;

  const dtenSection =
    !maintenanceEntry || maintenanceEntry.dten ? (
      <>
        <Separator className="bg-indigo-500" />
        <form.AppField name="dten">
          {(field) => <field.DTENField existingValue={maintenanceEntry?.dten} onTriggerAide={handleTriggerAide} />}
        </form.AppField>
      </>
    ) : null;

  return (
    <>
      <ScrollArea className="max-h-[calc(100dvh-300px)] rounded-2xl bg-background/40 p-3">
        <div className="my-2 flex flex-col gap-5 px-1">
          {/* Date */}
          <form.AppField name="date">{(field) => <field.DateField existingDate={maintenanceEntry?.date} />}</form.AppField>
          {/* Microphone */}

          {microphoneSection}

          {/* DTEN */}
          {dtenSection}

          <Separator className="bg-indigo-500" />
          {/* General Maintenance */}
          <div className="flex flex-col items-start">
            <h2 className="mb-3 font-semibold text-lg">General Maintenance</h2>
            <div className="w-full justify-center space-y-3 rounded-md bg-zinc-950/30 p-3 ring-1 ring-white/15">
              <form.AppField name="surfacesWiped">{(field) => <field.SurfacesWipedField existingEntry={maintenanceEntry} />}</form.AppField>
              <form.AppField name="equipmentChecked">
                {(field) => <field.EquipmentCheckedField existingEntry={maintenanceEntry} />}
              </form.AppField>
            </div>
          </div>
        </div>
      </ScrollArea>
      <DialogFooter className="my-3">
        <DialogClose asChild>
          <Button variant="outline">{maintenanceEntry ? "Close" : "Cancel"}</Button>
        </DialogClose>
        {!maintenanceEntry && (
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
        )}
      </DialogFooter>

      <MaintenanceAideDialog
        open={aideOpen}
        onOpenChange={setAideOpen}
        roomId={roomId}
        type={aideType}
        onCreateNew={() => {
          if (aideType === "task") setCreateTaskOpen(true);
          else if (aideType === "issue") setCreateIssueOpen(true);
        }}
      />

      <TaskDialog roomId={roomId} open={createTaskOpen} onOpenChange={setCreateTaskOpen} />
      <IssueDialog roomId={roomId} open={createIssueOpen} onOpenChange={setCreateIssueOpen} />
    </>
  );
}
