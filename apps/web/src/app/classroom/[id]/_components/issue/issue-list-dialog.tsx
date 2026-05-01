import type { issueSchema } from "@redwood/contracts";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Separator } from "@redwood/shad-ui/components/separator";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import type { z } from "zod";
import { IssueCard } from "./issue-card";
import { IssueDialog } from "./issue-dialog";

const ISSUE_ROW_ESTIMATE_PX = 106;
const INTERSECTION_ROOT_MARGIN = "160px 0px";

export function IssueListDialog({
  title,
  issues,
  foreignView = false,
  children,
  emptyMessage = "No issues found",
  hasMore,
  isFetchingMore,
  isLoading,
  onLoadMore,
  onOpenChange,
  open,
}: {
  title: string;
  issues: z.infer<typeof issueSchema>[];
  foreignView?: boolean;
  children?: React.ReactNode;
  emptyMessage?: string;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  isLoading?: boolean;
  onLoadMore?: () => void;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}) {
  const [viewportElement, setViewportElement] = useState<HTMLDivElement | null>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const { inView, ref: loadMoreRef } = useInView({
    root: viewportElement,
    rootMargin: INTERSECTION_ROOT_MARGIN,
  });

  const isOpen = open ?? uncontrolledOpen;
  const showEndSeparator = Boolean(onLoadMore && !hasMore && !isFetchingMore);
  const rowCount = issues.length + (showEndSeparator ? 1 : 0);
  const loadMoreIndex = hasMore && issues.length > 0 ? Math.max(issues.length - 2, 0) : undefined;

  const handleOpenChange = (nextOpen: boolean) => {
    if (open === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  const viewportRef = useCallback((node: HTMLDivElement | null) => {
    setViewportElement((prev) => (prev === node ? prev : node));
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => viewportElement,
    estimateSize: () => ISSUE_ROW_ESTIMATE_PX,
    overscan: 1,
    getItemKey: (index) => issues[index]?._id ?? "end-of-issues",
  });

  useEffect(() => {
    if (!inView || !hasMore || isFetchingMore || !onLoadMore) return;
    onLoadMore();
  }, [hasMore, inView, isFetchingMore, onLoadMore]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="bg-zinc-800 p-3">
        <DialogTitle className="text-center font-semibold text-xl">{title}</DialogTitle>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-400">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : issues.length > 0 ? (
          <ScrollArea className="max-h-[50vh] rounded-2xl bg-zinc-900 p-3" viewportRef={viewportRef}>
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: "relative",
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const issue = issues[virtualItem.index];
                const isEndSeparator = showEndSeparator && virtualItem.index === issues.length;

                if (isEndSeparator) {
                  return (
                    <div
                      key={virtualItem.key}
                      data-index={virtualItem.index}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualItem.start}px)`,
                      }}
                      ref={(node) => {
                        rowVirtualizer.measureElement(node);
                      }}
                    >
                      <div className="flex items-center gap-3 py-4">
                        <Separator className="bg-zinc-700" />
                      </div>
                    </div>
                  );
                }

                if (!issue) return null;

                return (
                  <div
                    key={virtualItem.key}
                    data-index={virtualItem.index}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    ref={(node) => {
                      rowVirtualizer.measureElement(node);
                      if (virtualItem.index === loadMoreIndex) loadMoreRef(node);
                    }}
                  >
                    <IssueDialog roomId={issue.classroomId} existingIssue={issue}>
                      <IssueCard issue={issue} foreignView={foreignView} />
                    </IssueDialog>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-400">
            <span>{emptyMessage}</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
