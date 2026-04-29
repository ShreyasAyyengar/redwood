import type { classroomSchemaPayload } from "@redwood/contracts";
import type { Column } from "@tanstack/react-table";
import { SlidersHorizontal, ThumbsUp, TriangleAlert } from "lucide-react";
import type { z } from "zod";

export default function StatusHeader({ column }: { column: Column<z.infer<typeof classroomSchemaPayload>> }) {
  return (
    <div>
      <div
        className="flex cursor-pointer items-center justify-center rounded-md border border-black/0 bg-neutral-700/50 px-3 py-0.5 transition-all duration-100 hover:border hover:border-neutral-700/50 hover:bg-neutral-700/75 hover:shadow-xl/100 active:scale-95 active:transform"
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
        <p className="text-lg">Status</p>
        {column.getIsSorted() ? (
          column.getIsSorted() === "asc" ? (
            <TriangleAlert className="ml-2 size-6 text-red-500" />
          ) : (
            <ThumbsUp className="ml-2 size-6" />
          )
        ) : (
          <SlidersHorizontal className="ml-2 size-6 rotate-90" />
        )}
      </div>
    </div>
  );
}
