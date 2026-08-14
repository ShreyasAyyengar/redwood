import { maintenanceFormSchema as serviceMaintenanceFormSchema } from "@backend/convex/core/maintenance/schemas";
import { z } from "zod";

/**
 * Convex methods expect ISO date strings for date fields. These are utility schemas and methods to handle the conversions
 */
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
