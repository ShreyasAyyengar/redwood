import { cn } from "@redwood/shad-ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { webClientORPC } from "../../../../lib/orpc-web-client";
import IssueHistoryDialog from "../../../classroom/[id]/_components/issue/issue-history-dialog";

export default function IssueOverview() {
  const { data: issues = [], isFetching } = useQuery(
    webClientORPC.issues.getAllIssues.queryOptions({
      input: {},
      staleTime: 60_000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    })
  );

  const activeIssues = issues.filter((issue) => !issue.resolution);
  const urgentIssues = activeIssues.filter((issue) => issue.issue.urgent);
  const supervisorIssues = activeIssues.filter((issue) => issue.issue.supervisorNeeded);

  function maybeWrapWithDialog(children: React.ReactNode, filteredIssues: typeof issues, title: string) {
    if (filteredIssues.length < 1) return children;

    return (
      <IssueHistoryDialog title={title} issues={filteredIssues}>
        {children}
      </IssueHistoryDialog>
    );
  }

  return (
    <div>
      <div className="flex items-center">
        <div className="rounded-lg border bg-zinc-700 p-1">
          <TriangleAlert className="h-5 w-5" />
        </div>
        <div className="ml-2 flex flex-col">
          <span className="font-bold text-md">Issues Overview: </span>
          <span className="text-neutral-400 text-sm">{isFetching ? "Loading..." : `${issues.length} total issues`}</span>
        </div>
      </div>

      <div className="flex gap-3">
        {maybeWrapWithDialog(
          <div
            className={cn(
              "mt-3 flex w-max flex-col rounded-lg border-2 p-2 shadow-lg/30 transition-all hover:-translate-y-1 hover:shadow-xl/100",
              activeIssues.length > 0 ? "border-blue-800 bg-blue-950 text-blue-100" : "border-emerald-800 bg-emerald-950 text-emerald-100"
            )}
          >
            <span className={cn("font-medium", activeIssues.length > 0 ? "text-blue-100" : "text-emerald-100")}>Active Issues</span>
            <span className="font-bold text-3xl">{isFetching ? "Loading..." : activeIssues.length}</span>
            <span className={cn(activeIssues.length > 0 ? "text-blue-100/70" : "text-emerald-100/70")}>
              {activeIssues.length > 0 ? "Currently open" : "All clear"}
            </span>
          </div>,
          activeIssues,
          "All Active Issues:"
        )}

        {maybeWrapWithDialog(
          <div
            className={cn(
              "mt-3 flex w-max flex-col rounded-lg border-2 p-2 shadow-lg/30 transition-all hover:-translate-y-1 hover:shadow-xl/100",
              urgentIssues.length > 0 ? "border-red-800 bg-red-950 text-red-100" : "border-emerald-800 bg-emerald-950 text-emerald-100"
            )}
          >
            <span className={cn("font-medium", urgentIssues.length > 0 ? "text-red-100" : "text-emerald-100")}>Urgent Issues</span>
            <span className="font-bold text-3xl">{isFetching ? "Loading..." : urgentIssues.length}</span>
            <span className={cn(urgentIssues.length > 0 ? "text-red-100/70" : "text-emerald-100/70")}>
              {urgentIssues.length > 0 ? "Need priority" : "All clear"}
            </span>
          </div>,
          urgentIssues,
          "All Urgent Issues:"
        )}

        {maybeWrapWithDialog(
          <div
            className={cn(
              "mt-3 flex w-max flex-col rounded-lg border-2 p-2 shadow-lg/30 transition-all hover:-translate-y-1 hover:shadow-xl/100",
              supervisorIssues.length > 0
                ? "border-purple-800 bg-purple-950 text-purple-100"
                : "border-emerald-800 bg-emerald-950 text-emerald-100"
            )}
          >
            <span className={cn("font-medium", supervisorIssues.length > 0 ? "text-purple-100" : "text-emerald-100")}>Supervisor Issues</span>
            <span className="whitespace-nowrap font-bold text-3xl">{isFetching ? "Loading..." : supervisorIssues.length}</span>
            <span className={cn(supervisorIssues.length > 0 ? "text-purple-100/70" : "text-emerald-100/70")}>
              {supervisorIssues.length > 0 ? "Awaiting escalation" : "All clear"}
            </span>
          </div>,
          supervisorIssues,
          "All Supervisor Issues:"
        )}
      </div>
    </div>
  );
}
