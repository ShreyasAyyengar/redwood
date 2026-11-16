import { cn } from "@redwood/shad-ui/lib/utils";
import type { LegacyRow as Row } from "@tanstack/react-table/legacy";
import { formatDate } from "#/util/date-time-utils.ts";
import { urgencyStyle } from "#/util/style-util.ts";
import type { ClassroomSummary } from "../../../model/classroom-types";
import { getClassroomMaintenanceDisplay } from "../../../model/maintenance-age";
import { useClassroomMaintenanceDay } from "../../classroom-maintenance-day-provider";

export default function LastServicedCell({ row }: { row: Row<ClassroomSummary> }) {
  const today = useClassroomMaintenanceDay();
  const { lastMaintenance } = row.original;
  if (!lastMaintenance) return <div className="text-center text-foreground text-lg">No Record Yet</div>;

  const date = new Date(lastMaintenance.date);
  const formatDateShort = formatDate(date);

  const { age, color, status } = getClassroomMaintenanceDisplay(date, today);

  return (
    <div className="flex flex-col">
      <div className="mt-1 flex items-center justify-center">
        <span className={cn("rounded-full px-2 py-0.5 text-lg", urgencyStyle(color))}>
          <span className="capitalize">{age}</span>
          {` • ${status}`}
        </span>
      </div>

      <div className={cn("mt-1 text-center")}>{`${formatDateShort} • ${lastMaintenance.by.split("@")[0]}`}</div>
    </div>
  );
}
