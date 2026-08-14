import { api } from "@backend/convex/_generated/api";
import type { Id } from "@backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type React from "react";
import { useState } from "react";
import { TaskListDialog } from "./task-list-dialog";

export function ClassroomTaskHistoryDialog({
  children,
  classroomId,
  title,
}: {
  children?: React.ReactNode;
  classroomId: Id<"classrooms">;
  title: string;
}) {
  const [open, setOpen] = useState(false);

  const tasks = useQuery(api.core.tasks.service.getClassroomTasks, open ? { classroomId } : "skip");

  return (
    <TaskListDialog
      emptyMessage="No task history found"
      isLoading={tasks === undefined}
      onOpenChange={setOpen}
      open={open}
      tasks={tasks ?? []}
      title={title}
    >
      {children}
    </TaskListDialog>
  );
}
