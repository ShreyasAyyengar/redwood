import { api } from "@backend/convex/_generated/api";
import type { Id } from "@backend/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import type React from "react";
import { useState } from "react";
import { IssueListDialog } from "./issue-list-dialog";

export function ClassroomIssueHistoryDialog({
  children,
  classroomId,
  title,
}: {
  children?: React.ReactNode;
  classroomId: Id<"classrooms">;
  title: string;
}) {
  const [open, setOpen] = useState(false);

  const issues = useQuery(api.core.issues.service.getClassroomIssues, open ? { classroomId } : "skip");

  return (
    <IssueListDialog
      emptyMessage="No issue history found"
      isLoading={issues === undefined}
      onOpenChange={setOpen}
      open={open}
      issues={issues ?? []}
      title={title}
    >
      {children}
    </IssueListDialog>
  );
}
