import { api } from "@backend/convex/_generated/api";
import { cn } from "@redwood/shad-ui/lib/utils";
import { usePaginatedQuery } from "convex/react";
import { TriangleAlert } from "lucide-react";
import type React from "react";
import { useEffect } from "react";
import type { Issue } from "../model/issue-state";
import { sortActiveIssues } from "../model/issue-state";
import { IssueListDialog } from "./dialogs/issue-list-dialog";

const ISSUE_OVERVIEW_PAGE_SIZE = 100;

function maybeWrapWithDialog(children: React.ReactNode, filteredIssues: Issue[], title: string) {
  if (filteredIssues.length < 1) return children;

  return (
    <IssueListDialog title={title} issues={filteredIssues} foreignView={true}>
      {children}
    </IssueListDialog>
  );
}

type IssueStatCardProps = React.HTMLAttributes<HTMLDivElement> & {
  activeClassName: string;
  activeDescription: string;
  activeMutedTextClassName: string;
  activeTextClassName: string;
  count: number;
  inactiveDescription?: string;
  isFetching: boolean;
  ref?: React.Ref<HTMLDivElement>;
  title: string;
  valueClassName?: string;
};

function IssueStatCard({
  activeClassName,
  activeDescription,
  activeMutedTextClassName,
  activeTextClassName,
  className,
  count,
  inactiveDescription = "All clear",
  isFetching,
  ref,
  title,
  valueClassName,
  ...props
}: IssueStatCardProps) {
  const hasIssues = count > 0;
  const textClassName = hasIssues ? activeTextClassName : "text-emerald-100";

  return (
    <div
      ref={ref}
      {...props}
      className={cn(
        "mt-3 flex w-max flex-col rounded-lg border-2 p-2 shadow-lg/30 transition-all hover:-translate-y-1 hover:shadow-xl/100",
        hasIssues ? activeClassName : "border-emerald-800 bg-emerald-950 text-emerald-100",
        className
      )}
    >
      <span className={cn("font-medium", textClassName)}>{title}</span>
      <span className={cn("font-bold text-3xl", valueClassName)}>{isFetching ? "Loading..." : count}</span>
      <span className={cn(hasIssues ? activeMutedTextClassName : "text-emerald-100/70")}>
        {hasIssues ? activeDescription : inactiveDescription}
      </span>
    </div>
  );
}

export default function IssueOverview() {
  const {
    results: issues,
    status,
    loadMore,
  } = usePaginatedQuery(api.core.issues.service.getIssues, { view: "ACTIVE" }, { initialNumItems: ISSUE_OVERVIEW_PAGE_SIZE });

  useEffect(() => {
    if (status === "CanLoadMore") loadMore(ISSUE_OVERVIEW_PAGE_SIZE);
  }, [loadMore, status]);

  const isFetching = status === "LoadingFirstPage" || status === "LoadingMore";
  const activeIssues = sortActiveIssues(issues);
  const urgentIssues = activeIssues.filter((issue) => issue.issue.urgent);
  const supervisorIssues = activeIssues.filter((issue) => issue.issue.supervisorNeeded);

  return (
    <div>
      <div className="flex items-center">
        <div className="rounded-lg border bg-zinc-700 p-1">
          <TriangleAlert className="size-5" />
        </div>
        <div className="ml-2 flex flex-col">
          <span className="font-bold text-md">Issues Overview: </span>
          <span className="text-neutral-400 text-sm">{isFetching ? "Loading..." : `${issues.length} active issues`}</span>
        </div>
      </div>

      <div className="flex gap-3">
        {maybeWrapWithDialog(
          <IssueStatCard
            activeClassName="border-blue-800 bg-blue-950 text-blue-100"
            activeDescription="Currently open"
            activeMutedTextClassName="text-blue-100/70"
            activeTextClassName="text-blue-100"
            count={activeIssues.length}
            isFetching={isFetching}
            title="Active Issues"
          />,
          activeIssues,
          "All Active Issues:"
        )}

        {maybeWrapWithDialog(
          <IssueStatCard
            activeClassName="border-red-800 bg-red-950 text-red-100"
            activeDescription="Need priority"
            activeMutedTextClassName="text-red-100/70"
            activeTextClassName="text-red-100"
            count={urgentIssues.length}
            isFetching={isFetching}
            title="Urgent Issues"
          />,
          urgentIssues,
          "All Urgent Issues:"
        )}

        {maybeWrapWithDialog(
          <IssueStatCard
            activeClassName="border-purple-800 bg-purple-950 text-purple-100"
            activeDescription="Awaiting escalation"
            activeMutedTextClassName="text-purple-100/70"
            activeTextClassName="text-purple-100"
            count={supervisorIssues.length}
            isFetching={isFetching}
            title="Supervisor Issues"
            valueClassName="whitespace-nowrap"
          />,
          supervisorIssues,
          "All Supervisor Issues:"
        )}
      </div>
    </div>
  );
}
