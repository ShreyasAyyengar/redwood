import type { taskSchema } from "@redwood/contracts";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { useVirtualizer } from "@tanstack/react-virtual";
import type React from "react";
import { useCallback, useState } from "react";
import type { z } from "zod";
import { TaskCard } from "./task-card";
import { TaskDialog } from "./task-dialog";

export default function TaskHistoryDialog({
  title,
  tasks,
  children,
}: {
  title: string;
  tasks?: z.infer<typeof taskSchema>[];
  children?: React.ReactNode;
}) {
  const [viewportElement, setViewportElement] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const viewportRef = useCallback((node: HTMLDivElement | null) => {
    setViewportElement((prev) => (prev === node ? prev : node));
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: tasks?.length ?? 0,
    getScrollElement: () => viewportElement,
    estimateSize: () => 82,
    overscan: 3,
    getItemKey: (index) => tasks?.[index]?._id ?? index,
  });

  if (!tasks?.length) return null;

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
              const task = tasks[virtualItem.index];
              if (!task) return null;

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
                  ref={rowVirtualizer.measureElement}
                >
                  <TaskDialog roomId={task.classroomId} existingTask={task}>
                    <TaskCard task={task} />
                  </TaskDialog>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
