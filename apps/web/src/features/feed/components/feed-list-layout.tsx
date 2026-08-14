"use client";

import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Separator } from "@redwood/shad-ui/components/separator";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2 } from "lucide-react";
import { Fragment, type ReactNode, useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

const FEED_LIST_SHELL_CLASS = "flex h-full w-full min-w-0 justify-center overflow-hidden";
const FEED_SCROLL_AREA_CLASS = "h-full w-1/2 min-w-0 p-4";
const STACKED_FEED_LIST_CLASS = "flex min-w-0 flex-col gap-2";
const VIRTUAL_FEED_ROW_CLASS = "absolute top-0 left-0 w-full min-w-0 pb-2";
const INTERSECTION_ROOT_MARGIN = "160px 0px";
const END_SEPARATOR_ROW_ESTIMATE_PX = 40;

type FeedItem = {
  _id: string;
};

type FeedListProps<TItem extends FeedItem> = {
  items: TItem[];
  renderItem: (item: TItem) => ReactNode;
};

type VirtualizedFeedListProps<TItem extends FeedItem> = FeedListProps<TItem> & {
  estimateSize: number;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
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
    <div className={FEED_LIST_SHELL_CLASS}>
      <ScrollArea className={FEED_SCROLL_AREA_CLASS} type="always">
        <div className={STACKED_FEED_LIST_CLASS}>
          {items.map((item) => (
            <Fragment key={item._id}>{renderItem(item)}</Fragment>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export function VirtualizedFeedList<TItem extends FeedItem>({
  items,
  estimateSize,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  renderItem,
}: VirtualizedFeedListProps<TItem>) {
  const [viewportElement, setViewportElement] = useState<HTMLDivElement | null>(null);
  const { inView, ref: loadMoreRef } = useInView({
    root: viewportElement,
    rootMargin: INTERSECTION_ROOT_MARGIN,
  });
  const showEndSeparator = Boolean(onLoadMore && hasNextPage === false && !isFetchingNextPage && items.length > 0);
  const rowCount = items.length + (showEndSeparator ? 1 : 0);
  const loadMoreIndex = hasNextPage && items.length > 1 ? items.length - 2 : undefined;

  const viewportRef = useCallback((node: HTMLDivElement | null) => {
    setViewportElement((prev) => (prev === node ? prev : node));
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => viewportElement,
    estimateSize: (index) => (showEndSeparator && index === items.length ? END_SEPARATOR_ROW_ESTIMATE_PX : estimateSize),
    overscan: 2,
    getItemKey: (index) => items[index]?._id ?? "end-of-feed",
  });

  useEffect(() => {
    if (!inView || !hasNextPage || isFetchingNextPage || !onLoadMore) return;
    onLoadMore();
  }, [hasNextPage, inView, isFetchingNextPage, onLoadMore]);

  return (
    <div className={FEED_LIST_SHELL_CLASS}>
      <ScrollArea className={FEED_SCROLL_AREA_CLASS} type="always" viewportRef={viewportRef}>
        <div className="relative w-full min-w-0" style={{ height: rowVirtualizer.getTotalSize() }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const item = items[virtualRow.index];
            const isEndSeparator = showEndSeparator && virtualRow.index === items.length;

            if (isEndSeparator) {
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  data-testid="feed-end-separator"
                  ref={rowVirtualizer.measureElement}
                  className={VIRTUAL_FEED_ROW_CLASS}
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <div className="flex items-center py-5">
                    <Separator className="h-px bg-zinc-600" />
                  </div>
                </div>
              );
            }

            if (!item) {
              return null;
            }

            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={(node) => {
                  rowVirtualizer.measureElement(node);
                  if (virtualRow.index === loadMoreIndex) loadMoreRef(node);
                }}
                className={VIRTUAL_FEED_ROW_CLASS}
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                {renderItem(item)}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
