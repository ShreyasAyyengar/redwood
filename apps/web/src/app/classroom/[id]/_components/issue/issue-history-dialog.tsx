import type { issueSchema } from "@redwood/contracts";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { useVirtualizer } from "@tanstack/react-virtual";
import type React from "react";
import { useCallback, useState } from "react";
import type { z } from "zod";
import { IssueCard } from "./issue-card";
import { IssueDialog } from "./issue-dialog";

export default function IssueHistoryDialog({
  title,
  issues,
  children,
}: {
  title: string;
  issues?: z.infer<typeof issueSchema>[];
  children?: React.ReactNode;
}) {
  const [viewportElement, setViewportElement] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const viewportRef = useCallback((node: HTMLDivElement | null) => {
    setViewportElement((prev) => (prev === node ? prev : node));
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: issues?.length ?? 0,
    getScrollElement: () => viewportElement,
    estimateSize: () => 82,
    overscan: 3,
  });

  if (!issues?.length) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="bg-zinc-800 p-3">
        <DialogTitle className="text-center font-semibold text-xl">{title}</DialogTitle>

        <ScrollArea className="max-h-[50vh] rounded-2xl bg-zinc-900 p-3" viewportRef={viewportRef}>
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const issue = issues[virtualItem.index];
              if (!issue) return null;

              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <IssueDialog roomId={issue.classroomId} existingIssue={issue}>
                    <IssueCard issue={issue} />
                  </IssueDialog>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
