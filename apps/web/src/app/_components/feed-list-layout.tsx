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

const STACKED_FEED_LIST_CLASS = "flex h-full w-full min-w-0 flex-col items-center gap-2 overflow-y-auto p-4";
export function StackedFeedList<TItem extends FeedItem>({ items, renderItem }: FeedListProps<TItem>) {
  return (
    <div className={STACKED_FEED_LIST_CLASS}>
      {items.map((item) => (
        <Fragment key={item._id}>{renderItem(item)}</Fragment>
      ))}
    </div>
  );
}

const FEED_SCROLL_AREA_CLASS = "h-full w-full min-w-0 overflow-y-auto p-4";
const VIRTUAL_FEED_ROW_CLASS = "absolute top-0 left-0 flex w-full min-w-0 justify-center pb-2";
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
    <div ref={parentRef} className={FEED_SCROLL_AREA_CLASS}>
      <div className="relative w-full min-w-0" style={{ height: rowVirtualizer.getTotalSize() }}>
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
              className={VIRTUAL_FEED_ROW_CLASS}
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
