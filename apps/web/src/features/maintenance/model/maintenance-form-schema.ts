import { maintenanceFormSchema as serviceMaintenanceFormSchema } from "@backend/convex/core/maintenance/schemas";
import { z } from "zod";

export const maintenanceFormSchema = serviceMaintenanceFormSchema.omit({ date: true }).extend({
  date: z.date(),
});

export type MaintenanceFormValues = z.input<typeof maintenanceFormSchema>;

export function serializeMaintenanceFormValues(values: MaintenanceFormValues) {
  return {
    ...values,
    date: values.date.toISOString(),
  };
}
