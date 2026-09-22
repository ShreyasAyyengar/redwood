import type { ClassroomSummary } from "#/features/classrooms/model/classroom-types.ts";
import { daysAgoNumeric } from "#/util/date-time-utils.ts";
import type { findShiftOpenings } from "./availability";
export const SERVICE_STATUSES = ["Up to Date", "Pending", "Overdue", "No Record Yet"] as const;
export type ServiceStatus = (typeof SERVICE_STATUSES)[number];
export type ShiftMatch = { room: ClassroomSummary; openings: ReturnType<typeof findShiftOpenings> };
export function getServiceStatus(room: ClassroomSummary): ServiceStatus {
  if (!room.lastMaintenance) return "No Record Yet";
  const days = daysAgoNumeric(new Date(room.lastMaintenance.date));
  const recentDays = 14;
  const overdueDays = 30;
  return days < recentDays ? "Up to Date" : days <= overdueDays ? "Pending" : "Overdue";
}
