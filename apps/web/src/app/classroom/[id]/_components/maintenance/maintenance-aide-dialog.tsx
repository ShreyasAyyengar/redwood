import { Button } from "@redwood/shad-ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@redwood/shad-ui/components/dialog";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { webClientORPC } from "../../../../../lib/orpc-web-client";
import { IssueCard } from "../issue/issue-card";
import { TaskCard } from "../task/task-card";

export function MaintenanceAideDialog({
  open,
  onOpenChange,
  roomId,
  type,
  onCreateNew,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  type: "task" | "issue" | null;
  onCreateNew: () => void;
}) {
  const { data: issues } = useQuery(
    webClientORPC.issues.getIssues.queryOptions({
      input: { classroomId: roomId },
    })
  );

  const { data: tasks } = useQuery(
    webClientORPC.tasks.getTasks.queryOptions({
      input: { classroomId: roomId },
    })
  );

  if (!type) return null;

  const openIssues = issues?.filter((issue) => !issue.resolution) ?? [];
  const now = Date.now();
  const openTasks = tasks?.filter((task) => !task.completion && (!task.task.visibleAt || new Date(task.task.visibleAt).getTime() <= now)) ?? [];

  const list = type === "task" ? openTasks : openIssues;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-zinc-800 bg-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Create a{type === "issue" && "n"} {type} to aid completing maintenance.
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Please check that the {type} does not already exist. If it does, select the 'Exists' button.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="mt-4 max-h-[400px] rounded-md bg-zinc-950/50 p-2">
          {list.length > 0 ? (
            <div className="space-y-3">
              {type === "task"
                ? openTasks.map((t) => <TaskCard key={t._id} task={t} />)
                : openIssues.map((i) => <IssueCard key={i._id} issue={i} />)}
            </div>
          ) : (
            <div className="py-8 text-center text-zinc-500">No open {type}s found.</div>
          )}
        </ScrollArea>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            onClick={() => {
              onOpenChange(false);
              onCreateNew();
            }}
            className={type === "task" ? "bg-blue-600 hover:bg-blue-700" : "bg-yellow-600 hover:bg-yellow-700"}
          >
            Create New {type === "task" ? "Task" : "Issue"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {type === "issue" ? "Issue" : "Task"} Exists
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
