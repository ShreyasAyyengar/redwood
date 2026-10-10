"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2 } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";

const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 40;
const PAGE_PREFETCH_ROWS = 8;

export type FeedTableColumn<T> = {
  id: string;
  header: string;
  width: number;
  grow?: boolean;
  cell: (item: T) => ReactNode;
};

export function VirtualizedFeedTable<T extends { _id: string }>({
  items,
  columns,
  total,
  label,
  loading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onOpen,
}: {
  items: T[];
  columns: FeedTableColumn<T>[];
  total?: number;
  label: string;
  loading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onOpen: (item: T) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => viewport.current,
    estimateSize: () => ROW_HEIGHT,
    scrollMargin: HEADER_HEIGHT,
    getItemKey: (index) => items[index]?._id ?? index,
    overscan: PAGE_PREFETCH_ROWS,
  });
  const rows = virtualizer.getVirtualItems();
  const lastRow = rows.at(-1)?.index ?? -1;
  const gridTemplateColumns = columns.map((column) => (column.grow ? `minmax(${column.width}px, 1fr)` : `${column.width}px`)).join(" ");
  const minWidth = columns.reduce((width, column) => width + column.width, 0);

  useEffect(() => {
    if (!loading && hasNextPage && !isFetchingNextPage && lastRow >= items.length - PAGE_PREFETCH_ROWS) onLoadMore();
  }, [hasNextPage, isFetchingNextPage, items.length, lastRow, loading, onLoadMore]);

  return (
    <div ref={viewport} className="h-full overflow-auto rounded-lg border border-zinc-800 bg-zinc-950/30">
      <table
        aria-label={label}
        aria-rowcount={total === undefined ? -1 : total + 1}
        aria-busy={loading}
        className="grid w-full text-sm"
        style={{ minWidth }}
      >
        <thead className="sticky top-0 z-10 grid border-zinc-800 border-b bg-zinc-900">
          <tr className="grid h-10 items-center" style={{ gridTemplateColumns }}>
            {columns.map((column) => (
              <th key={column.id} scope="col" className="px-4 text-left font-medium text-xs text-zinc-400">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="relative grid" style={{ height: virtualizer.getTotalSize() }}>
          {rows.map((row) => {
            const item = items[row.index];
            if (!item) return null;
            return (
              <tr
                key={row.key}
                aria-rowindex={row.index + 2}
                tabIndex={0}
                onDoubleClick={() => onOpen(item)}
                onKeyDown={(event) => {
                  if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
                  event.preventDefault();
                  onOpen(item);
                }}
                className="absolute top-0 left-0 grid w-full cursor-default items-center border-zinc-800/60 border-b outline-none hover:bg-zinc-800/40 focus-visible:bg-zinc-800/60 focus-visible:ring-1 focus-visible:ring-zinc-500 focus-visible:ring-inset"
                style={{ height: ROW_HEIGHT, transform: `translateY(${row.start - HEADER_HEIGHT}px)`, gridTemplateColumns }}
              >
                {columns.map((column) => (
                  <td key={column.id} className="min-w-0 overflow-hidden px-4 text-zinc-300">
                    {column.cell(item)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {loading || isFetchingNextPage ? (
        <div role="status" className="flex items-center justify-center gap-2 p-6 text-sm text-zinc-500">
          <Loader2 className="size-4 animate-spin" />
          Loading {label.toLowerCase()}…
        </div>
      ) : items.length === 0 && !hasNextPage ? (
        <div className="p-12 text-center text-sm text-zinc-500">No {label.toLowerCase()} found</div>
      ) : null}
    </div>
  );
}
