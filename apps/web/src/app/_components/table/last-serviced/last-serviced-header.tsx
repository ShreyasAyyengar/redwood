import type { classroomSchema } from "@redwood/contracts";
import type { Column } from "@tanstack/react-table";
import { CalendarArrowDown, CalendarArrowUp, SlidersHorizontal, Wrench } from "lucide-react";
import type { z } from "zod";

// TODO figure out what <any> can be replaced with
export default function LastServicedHeader({ column }: { column: Column<z.infer<typeof classroomSchema>> }) {
  return (
    <div>
      <div
        className="flex items-center justify-center rounded-md bg-neutral-700/50 p-1"
        onClick={() => {
          // cycle between asd, desc, and default
          const currentSort = column.getIsSorted();
          if (currentSort === false) column.toggleSorting(false);
          else if (currentSort === "asc") column.toggleSorting(true);
          else column.clearSorting();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();

            const currentSort = column.getIsSorted();
            if (currentSort === false) column.toggleSorting(false);
            else if (currentSort === "asc") column.toggleSorting(true);
            else column.clearSorting();
          }
        }}
      >
        <Wrench className="mr-2 h-6 w-6" />
        <p className="text-lg">Last Serviced</p>
        {column.getIsSorted() ? (
          column.getIsSorted() === "asc" ? (
            <CalendarArrowUp className="ml-2 h-6 w-6 text-green-500" />
          ) : (
            <CalendarArrowDown className="ml-2 h-6 w-6 text-yellow-500" />
          )
        ) : (
          <SlidersHorizontal className="ml-2 h-6 w-6 rotate-90" />
        )}
      </div>
    </div>
  );
}
