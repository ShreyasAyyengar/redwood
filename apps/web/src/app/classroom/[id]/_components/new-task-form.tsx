import type { classroomSchema, taskFormSchema } from "@redwood/contracts";
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

export function NewTaskForm({ roomId, children }: { roomId: z.infer<typeof classroomSchema>["_id"]; children?: React.ReactNode }) {
  return (
  );
}
