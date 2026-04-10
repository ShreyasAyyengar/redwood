import { z } from "zod";
import { scheduleSchema } from "../rooms/classroom-contract";

// ===== INPUT =====
export const routeRequestSchema = z.object({
  startRoomName: z.string().min(1),
  startTimeMin: z.number().int().min(0).max(1439),
  endTimeMin: z.number().int().min(0).max(1439),
});

// ===== INTERNAL UNIT =====
export const routeStopSchema = z.object({
  groupKey: z.string(),
  sourceRoomName: z.string(),
  displayName: z.string(),
  schedule: scheduleSchema.optional(),
  roomStatus: z.string(),
});

// ===== OUTPUT =====
export const generateRouteOutputSchema = z.object({
  orderedStops: z.array(routeStopSchema),
});

// ===== TYPES =====
export type RouteRequest = z.infer<typeof routeRequestSchema>;
export type RouteStop = z.infer<typeof routeStopSchema>;
export type GenerateRouteOutput = z.infer<typeof generateRouteOutputSchema>;