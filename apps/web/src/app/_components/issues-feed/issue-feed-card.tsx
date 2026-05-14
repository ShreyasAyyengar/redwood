import { FINDINGS_OPTIONS, type issueSchema } from "@redwood/contracts";
import { Badge } from "@redwood/shad-ui/components/badge";
import { Card } from "@redwood/shad-ui/components/card";
import { MultiSelect, MultiSelectContent, MultiSelectItem, MultiSelectTrigger } from "@redwood/shad-ui/components/multi-select";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, Clock3, type LucideIcon, MessageSquare, TriangleAlert, User, UserCheck } from "lucide-react";
import { type ReactNode, type RefObject, useEffect, useRef, useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../lib/orpc-web-client";
import { getDateTimeDisplay } from "../../../util/date-time-utils";
import { urgencyStyle } from "../../../util/style-util";
import { getStatusSymbol } from "../../classroom/[id]/_components/issue/issue-card";
import { useFetchedRoomsStore } from "../room-store";

type IssueFeedCardIssue = z.infer<typeof issueSchema>;
type FindingOption = (typeof FINDINGS_OPTIONS)[number];
type DateDisplay = ReturnType<typeof getDateTimeDisplay>;

function areFindingsEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

function IssueMetaBox({
  icon: Icon,
  iconNode,
  label,
  value,
  title,
  className,
  iconClassName,
  valueClassName,
}: {
  icon?: LucideIcon;
  iconNode?: ReactNode;
  label: string;
  value: string;
  title?: string;
  className?: string;
  iconClassName?: string;
  valueClassName?: string;
}) {
  return (
    <div className={cn("flex flex-1 items-center gap-3 rounded-2xl border p-3 text-xs text-zinc-400", className)} title={title}>
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", iconClassName)}>
        {iconNode || (Icon && <Icon className="size-4" />)}
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="font-semibold text-[10px] text-zinc-500 uppercase tracking-[0.18em]">{label}</span>
        <span className={cn("truncate text-sm text-zinc-300", valueClassName)}>{value}</span>
      </div>
    </div>
  );
}

function FindingsBox({ issue }: { issue: IssueFeedCardIssue }) {
  const savedFindings = issue.resolution?.findings ?? [];
  const [selectedFindings, setSelectedFindings] = useState<string[]>(savedFindings);
  const savedFindingsRef = useRef<string[]>(savedFindings);
  const firstFinding = selectedFindings[0];
  const hiddenFindingsCount = Math.max(selectedFindings.length - 1, 0);

  const setIssueFindingsMutation = useMutation(webClientORPC.issues.setIssueFindings.mutationOptions());

  useEffect(() => {
    const nextFindings = issue.resolution?.findings ?? [];
    savedFindingsRef.current = nextFindings;
    setSelectedFindings(nextFindings);
  }, [issue.resolution?.findings]);

  const commitFindings = () => {
    if (areFindingsEqual(selectedFindings, savedFindingsRef.current)) return;

    setIssueFindingsMutation.mutate(
      {
        _id: issue._id,
        findings: selectedFindings as FindingOption[],
      },
      {
        onSuccess: () => {
          savedFindingsRef.current = selectedFindings;
        },
      }
    );
  };

  return (
    <div className="flex flex-1 items-center gap-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-3 text-xs text-zinc-400">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
        <ClipboardCheck className="size-4" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="font-semibold text-[10px] text-emerald-500/70 uppercase tracking-[0.18em]">Findings</span>
        <MultiSelect
          modal={false}
          values={selectedFindings}
          onValuesChange={setSelectedFindings}
          onOpenChange={(open) => !open && commitFindings()}
        >
          <MultiSelectTrigger
            className="min-h-8 w-full border-emerald-500/10 bg-emerald-500/5 px-2 py-1 text-emerald-100 hover:bg-emerald-500/10"
            disabled={setIssueFindingsMutation.isPending}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {firstFinding ? (
              <span className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="truncate">{firstFinding}</span>
                {hiddenFindingsCount > 0 && <span className="shrink-0 text-emerald-300/80">+{hiddenFindingsCount}</span>}
              </span>
            ) : (
              <span className="min-w-0 flex-1 truncate text-muted-foreground">Select findings</span>
            )}
          </MultiSelectTrigger>
          <MultiSelectContent
            search={false}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {FINDINGS_OPTIONS.map((finding) => (
              <MultiSelectItem key={finding} value={finding}>
                {finding}
              </MultiSelectItem>
            ))}
          </MultiSelectContent>
        </MultiSelect>
      </div>
    </div>
  );
}

function IssueResolutionSection({
  issue,
  resolutionDateDisplay,
}: {
  issue: IssueFeedCardIssue;
  resolutionDateDisplay: DateDisplay | undefined;
}) {
  if (!issue.resolution) return null;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
      {issue.resolution.comment && (
        <div className="flex items-start gap-3">
          <MessageSquare className="mt-0.5 size-4 shrink-0 text-emerald-500/50" />
          <div className="flex flex-col">
            <span className="font-bold text-[10px] text-emerald-500/70 uppercase tracking-[0.18em]">Resolution Note</span>
            <p className="text-emerald-200/90 text-sm leading-relaxed">{issue.resolution.comment}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row">
        <IssueMetaBox
          className="border-emerald-500/10 bg-emerald-500/5"
          icon={UserCheck}
          iconClassName="bg-emerald-500/10 text-emerald-400"
          label="Resolved By"
          value={issue.resolution.resolvedBy}
        />

        {resolutionDateDisplay && (
          <IssueMetaBox
            className="border-emerald-500/10 bg-emerald-500/5"
            icon={Clock3}
            iconClassName="bg-emerald-500/10 text-emerald-400"
            label="Resolved"
            title={`Resolved: ${resolutionDateDisplay.dateAbsolute}`}
            value={resolutionDateDisplay.dateDaysAgo}
            valueClassName="text-emerald-200"
          />
        )}

        <FindingsBox issue={issue} />
      </div>
    </div>
  );
}

function getIssueDisplayState(issue: IssueFeedCardIssue) {
  const isResolved = Boolean(issue.resolution);

  if (isResolved) {
    return {
      HeaderIcon: CheckCircle2,
      headerIconClassName: "border-emerald-500/20 bg-emerald-500/10",
      headerIconTextClassName: "text-emerald-400",
      isResolved,
      stateIconClassName: "bg-emerald-500/10 text-emerald-400",
      stateIconNode: getStatusSymbol(issue, 4),
      stateText: "Closed",
      stateTextClassName: "text-emerald-300",
    };
  }

  return {
    HeaderIcon: TriangleAlert,
    headerIconClassName: issue.issue.urgent ? "border-red-500/20 bg-red-500/10" : "border-amber-500/20 bg-amber-500/10",
    headerIconTextClassName: issue.issue.urgent ? "text-red-400" : "text-amber-400",
    isResolved,
    stateIconClassName: issue.issue.urgent ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400",
    stateIconNode: getStatusSymbol(issue, 4),
    stateText: issue.issue.sodId
      ? `Escalated to MSE: ${issue.issue.sodId}`
      : issue.issue.cruzfixId
        ? `Escalated to CruzFix: ${issue.issue.cruzfixId}`
        : issue.issue.urgent
          ? "Needs Urgent Attention"
          : "Needs attention",
    stateTextClassName: issue.issue.sodId ? "text-amber-300" : "text-zinc-200",
  };
}

export const IssueFeedCard = ({
  issue,
  className,
  ref,
  ...props
}: { issue: IssueFeedCardIssue } & React.HTMLAttributes<HTMLDivElement> & { ref?: RefObject<HTMLDivElement | null> }) => {
  const { fetchedRooms } = useFetchedRoomsStore();
  const room = fetchedRooms.find((r) => r._id === issue.classroomId);

  const reportedDateDisplay = getDateTimeDisplay(issue.issue.reportedAt);
  const resolutionDateDisplay = issue.resolution && getDateTimeDisplay(issue.resolution.resolvedAt);
  const { HeaderIcon, headerIconClassName, headerIconTextClassName, stateIconClassName, stateIconNode, stateText, stateTextClassName } =
    getIssueDisplayState(issue);

  return (
    <Card
      ref={ref}
      className={cn(
        "flex w-full flex-col gap-4 border-zinc-800/80 bg-zinc-900/50 p-4 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/70 active:scale-[0.99]",
        className
      )}
      {...props}
    >
      <div className="flex w-full min-w-0 flex-col gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
              headerIconClassName
            )}
          >
            <HeaderIcon className={cn("size-6", headerIconTextClassName)} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-col gap-2">
              <span className="font-bold text-lg text-zinc-100 leading-tight">{room ? room.displayName : "Unknown Room"}</span>
              {issue.issue.supervisorNeeded && (
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className={cn("h-6 px-2 text-[10px]", urgencyStyle("purple"))}>
                    Supervisor needed
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/70 to-transparent" />
        <p className="whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed">{issue.issue.description}</p>

        <div className="flex flex-col gap-3 md:flex-row">
          <IssueMetaBox
            className="border-zinc-800/80 bg-zinc-950/30"
            icon={Clock3}
            iconClassName="bg-zinc-800/80 text-zinc-400"
            label="Reported At"
            title={`Reported: ${reportedDateDisplay.dateAbsolute}`}
            value={reportedDateDisplay.dateDaysAgo}
            valueClassName="text-indigo-100"
          />

          <IssueMetaBox
            className="border-zinc-800/80 bg-zinc-950/30"
            icon={User}
            iconClassName="bg-zinc-800/80"
            label="Reported By"
            value={issue.issue.reportedBy}
          />

          <IssueMetaBox
            className="border-zinc-800/80 bg-zinc-950/30"
            iconClassName={stateIconClassName}
            iconNode={stateIconNode}
            label="Status"
            value={stateText}
            valueClassName={cn("font-medium", stateTextClassName)}
          />
        </div>
      </div>

      <IssueResolutionSection issue={issue} resolutionDateDisplay={resolutionDateDisplay || undefined} />
    </Card>
  );
};
