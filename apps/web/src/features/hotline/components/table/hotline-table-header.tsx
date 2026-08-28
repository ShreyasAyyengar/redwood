import { cn } from "@redwood/shad-ui/lib/utils";
import type { ReactTable } from "@tanstack/react-table";
import { COMPACT_COLUMN_IDS, GROWING_COLUMN_IDS } from "./table-layout.ts";
import type { HotlineTableItem, hotlineTableFeatures } from "./table-types.ts";

export function HotlineTableHeader({ table }: { table: ReactTable<typeof hotlineTableFeatures, HotlineTableItem> }) {
  return (
    <div className="sticky top-0 z-20 flex border-zinc-800 border-b bg-zinc-900/95 shadow-black/10 shadow-lg backdrop-blur-xl">
      {table.getHeaderGroups().flatMap((headerGroup) =>
        headerGroup.headers.map((header) => (
          <div
            key={header.id}
            className={cn(
              "flex h-11 items-center border-zinc-800/80 border-r px-3 font-semibold text-[10px] text-zinc-500 uppercase tracking-[0.16em] last:border-r-0",
              COMPACT_COLUMN_IDS.has(header.column.id) && "px-2",
              GROWING_COLUMN_IDS.has(header.column.id) ? "min-w-0 shrink grow" : "shrink-0",
              header.column.id === "actions" && "px-1"
            )}
            style={{ width: header.getSize() }}
          >
            {header.isPlaceholder ? null : <table.FlexRender header={header} />}
          </div>
        ))
      )}
    </div>
  );
}
