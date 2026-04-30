"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2 } from "lucide-react";
import { Fragment, type ReactNode, useRef } from "react";

type FeedItem = {
  _id: string;
};

type FeedListProps<TItem extends FeedItem> = {
  items: TItem[];
  renderItem: (item: TItem) => ReactNode;
};

type VirtualizedFeedListProps<TItem extends FeedItem> = FeedListProps<TItem> & {
  estimateSize: number;
};

export function FeedLoadingState() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="size-8 animate-spin text-zinc-500" />
    </div>
  );
}

export function FeedEmptyState({ children }: { children: ReactNode }) {
  return <div className="flex h-full items-center justify-center text-zinc-500">{children}</div>;
}

export function StackedFeedList<TItem extends FeedItem>({ items, renderItem }: FeedListProps<TItem>) {
  return (
    <div className="flex h-full w-full min-w-0 flex-col items-center gap-2 overflow-y-auto border border-red-500 p-4">
      {items.map((item) => (
        <Fragment key={item._id}>{renderItem(item)}</Fragment>
      ))}
    </div>
  );
}

export function VirtualizedFeedList<TItem extends FeedItem>({ items, estimateSize, renderItem }: VirtualizedFeedListProps<TItem>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan: 2,
    getItemKey: (index) => items[index]?._id ?? index,
  });

  return (
    <div ref={parentRef} className="flex h-full w-full min-w-0 justify-center overflow-y-auto border border-red-500 p-4">
      <div
        className="relative flex w-full min-w-0 flex-col items-center border border-blue-500"
        style={{ height: rowVirtualizer.getTotalSize() }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          if (!item) {
            return null;
          }

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="absolute top-0 left-0 w-full min-w-0 pb-2"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              {renderItem(item)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
