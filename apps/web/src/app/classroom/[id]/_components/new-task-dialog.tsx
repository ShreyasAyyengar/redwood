import type { classroomSchema, taskFormSchema } from "@redwood/contracts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import type { z } from "zod";
import DateField from "./maintenance/fields/date-field";
import DTENField from "./maintenance/fields/dten-field";
import EquipmentCheckedField from "./maintenance/fields/equipment-checked";
import MicrophoneField from "./maintenance/fields/microphone-field";
import SurfacesWipedField from "./maintenance/fields/surfaces-wiped";

export type FormValues = z.input<typeof taskFormSchema>;
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

export function NewTaskDialog({ roomId, children }: { roomId: z.infer<typeof classroomSchema>["_id"]; children?: React.ReactNode }) {
  return (
    <Dialog>
      <form>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="bg-zinc-800 p-3">
          <DialogHeader>
            <DialogTitle className="mx-auto rounded-md bg-zinc-950/30 px-10 py-3 text-center text-2xl ring-1 ring-white/15">
              Create New Task:
            </DialogTitle>
          </DialogHeader>
          <NewTaskDialog roomId={roomId} />
        </DialogContent>
      </form>
    </Dialog>
  );
}
