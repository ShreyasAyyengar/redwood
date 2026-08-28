"use client";

import type { Id } from "@backend/convex/_generated/dataModel";
import { useTable } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useMemo, useRef, useState } from "react";
import { getHotlineCategoryColumnWidth } from "../../model/hotline-table-layout.ts";
import { CategoryManagerDialog } from "./category/category-manager-dialog.tsx";
import { createHotlineColumns } from "./columns.tsx";
import { HotlineEntryRow } from "./entry-row/hotline-entry-row.tsx";
import { HotlineTableHeader } from "./hotline-table-header.tsx";
import { HotlineTableRow } from "./hotline-table-row.tsx";
import { HotlineTableEmptyState, HotlineTableSkeleton } from "./hotline-table-states.tsx";
import { HOTLINE_ROW_HEIGHT } from "./table-layout.ts";
import { type HotlineTableItem, type HotlineTableProps, hotlineTableFeatures } from "./table-types.ts";

export function HotlineTable({
  canManageCategories,
  categories,
  classrooms,
  currentUserEmail,
  editingEntry,
  entries,
  isAdmin,
  isCreating,
  onCancelCreate,
  onCancelEdit,
  onCreateSuccess,
  onEditSuccess,
  onEdit,
  users,
}: HotlineTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const roomById = useMemo(() => new Map(classrooms.map((classroom) => [classroom._id, classroom])), [classrooms]);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category._id, category.label])), [categories]);
  const categoryColumnWidth = useMemo(() => getHotlineCategoryColumnWidth(categories), [categories]);
  const columns = useMemo(
    () =>
      createHotlineColumns({
        canManageCategories,
        categoryColumnWidth,
        onOpenCategoryManager: () => setCategoryManagerOpen(true),
      }),
    [canManageCategories, categoryColumnWidth]
  );
  const data = useMemo<HotlineTableItem[]>(
    () =>
      (entries ?? [])
        .map((entry) => ({
          entry,
          room: roomById.get(entry.callerLocation as Id<"classrooms">),
          categoryLabel: categoryById.get(entry.hotlineCategory) ?? "Unknown category",
        }))
        .sort((left, right) => Date.parse(right.entry.dateOfCall) - Date.parse(left.entry.dateOfCall)),
    [categoryById, entries, roomById]
  );
  const table = useTable({ data, columns, features: hotlineTableFeatures });
  const { rows } = table.getRowModel();
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => HOTLINE_ROW_HEIGHT,
    getItemKey: (index) => rows[index]?.original.entry._id ?? index,
    overscan: 8,
  });

  useEffect(() => {
    if (isCreating) scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [isCreating]);

  return (
    <>
      {canManageCategories && <CategoryManagerDialog categories={categories} onOpenChange={setCategoryManagerOpen} open={categoryManagerOpen} />}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-zinc-950/40">
        <div className="w-full">
          <HotlineTableHeader table={table} />

          {entries === undefined ? (
            <HotlineTableSkeleton />
          ) : (
            <>
              {isCreating && (
                <HotlineEntryRow
                  categories={categories}
                  categoryColumnWidth={categoryColumnWidth}
                  classrooms={classrooms}
                  currentUserEmail={currentUserEmail}
                  isAdmin={isAdmin}
                  users={users}
                  onCancel={onCancelCreate}
                  onSuccess={onCreateSuccess}
                />
              )}

              {rows.length === 0 && !isCreating ? (
                <HotlineTableEmptyState />
              ) : (
                <div className="relative" style={{ height: rowVirtualizer.getTotalSize() }}>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const row = rows[virtualRow.index];
                    if (!row) return null;

                    return (
                      <HotlineTableRow
                        key={row.original.entry._id}
                        categories={categories}
                        categoryColumnWidth={categoryColumnWidth}
                        classrooms={classrooms}
                        currentUserEmail={currentUserEmail}
                        editingEntry={editingEntry}
                        isAdmin={isAdmin}
                        measureElement={rowVirtualizer.measureElement}
                        onCancelEdit={onCancelEdit}
                        onEdit={onEdit}
                        onEditSuccess={onEditSuccess}
                        row={row}
                        table={table}
                        users={users}
                        virtualRow={virtualRow}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
