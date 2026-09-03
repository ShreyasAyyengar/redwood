import type { Doc } from "@backend/convex/_generated/dataModel";
import { cn } from "@redwood/shad-ui/lib/utils";
import type { ReactTable, Row } from "@tanstack/react-table";
import type { VirtualItem } from "@tanstack/react-virtual";
import { RowActionsCell } from "./cells/row-actions-cell.tsx";
import { HotlineEntryRow } from "./entry-row/hotline-entry-row.tsx";
import { COMPACT_COLUMN_IDS, GROWING_COLUMN_IDS, HOTLINE_ROW_HEIGHT } from "./table-layout.ts";
import type { HotlineTableItem, hotlineTableFeatures } from "./table-types.ts";

type HotlineTableRowProps = {
  categories: Doc<"hotlineCategories">[];
  categoryColumnWidth: number;
  classrooms: Doc<"classrooms">[];
  currentUserEmail: string;
  editingEntry?: Doc<"hotline">;
  isAdmin: boolean;
  measureElement: (element: Element | null) => void;
  onCancelEdit: () => void;
  onEdit: (entry: Doc<"hotline">) => void;
  onEditSuccess: () => void;
  row: Row<typeof hotlineTableFeatures, HotlineTableItem>;
  table: ReactTable<typeof hotlineTableFeatures, HotlineTableItem>;
  users: Array<{ email: string }>;
  virtualRow: VirtualItem;
};

export function HotlineTableRow({
  categories,
  categoryColumnWidth,
  classrooms,
  currentUserEmail,
  editingEntry,
  isAdmin,
  measureElement,
  onCancelEdit,
  onEdit,
  onEditSuccess,
  row,
  table,
  users,
  virtualRow,
}: HotlineTableRowProps) {
  const { entry } = row.original;
  const virtualStyle = { transform: `translateY(${virtualRow.start}px)` };

  if (editingEntry?._id === entry._id) {
    return (
      <div key={entry._id} data-index={virtualRow.index} ref={measureElement} className="absolute top-0 left-0 z-10 w-full" style={virtualStyle}>
        <HotlineEntryRow
          categories={categories}
          categoryColumnWidth={categoryColumnWidth}
          classrooms={classrooms}
          currentUserEmail={currentUserEmail}
          existingEntry={entry}
          isAdmin={isAdmin}
          users={users}
          onCancel={onCancelEdit}
          onSuccess={onEditSuccess}
        />
      </div>
    );
  }

  return (
    <div
      key={entry._id}
      data-index={virtualRow.index}
      ref={measureElement}
      className="group/row absolute top-0 left-0 flex cursor-pointer border-zinc-800/70 border-b bg-zinc-950/10 outline-none transition-colors hover:bg-zinc-800/55 focus-visible:bg-zinc-800/55 focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-inset"
      style={{ ...virtualStyle, width: "100%", minHeight: HOTLINE_ROW_HEIGHT }}
      onDoubleClick={() => onEdit(entry)}
      title="Double-click to edit this hotline entry"
    >
      {row.getAllCells().map((cell) => (
        <div
          key={cell.id}
          className={cn(
            "flex items-center overflow-hidden border-zinc-800/60 border-r px-3 py-1.5 last:border-r-0",
            COMPACT_COLUMN_IDS.has(cell.column.id) && "px-2",
            GROWING_COLUMN_IDS.has(cell.column.id) ? "min-w-0 shrink grow" : "shrink-0",
            cell.column.id === "identifier" && "p-1",
            cell.column.id === "actions" && "px-1"
          )}
          style={{ width: cell.column.getSize() }}
        >
          {cell.column.id === "actions" ? <RowActionsCell entry={entry} onEdit={onEdit} /> : <table.FlexRender cell={cell} />}
        </div>
      ))}
    </div>
  );
}
