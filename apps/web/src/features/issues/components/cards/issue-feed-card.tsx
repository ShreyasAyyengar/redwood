import { api } from "@backend/convex/_generated/api";
import type { Doc } from "@backend/convex/_generated/dataModel";
import { toolbox2 } from "@lucide/lab";
import { Badge } from "@redwood/shad-ui/components/badge";
import { Card } from "@redwood/shad-ui/components/card";
import { MultiSelect, MultiSelectContent, MultiSelectItem, MultiSelectTrigger } from "@redwood/shad-ui/components/multi-select";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useMutation } from "convex/react";
import { CheckCircle2, ClipboardCheck, Clock3, Drill, Icon, OctagonPause, TriangleAlert, User, UserCheck } from "lucide-react";
import { type ComponentProps, type RefObject, useEffect, useRef, useState } from "react";
import { ClassroomAvailabilityPill } from "#/features/classrooms/components/classroom-availability-pill.tsx";
import { FeedCardDetails, FeedCardMetadata, FeedCardMetadataList, FeedCardNote } from "#/features/feed/components/feed-card-details.tsx";
import { getDateTimeDisplay } from "#/util/date-time-utils.ts";
import { urgencyStyle } from "#/util/style-util.ts";
import { ISSUE_FINDINGS_OPTIONS, type Issue } from "../../model/issue-state";
import { IssueStatusIcon } from "./issue-status-icon";

type IssueFeedCardIssue = Issue;
type FindingOption = (typeof ISSUE_FINDINGS_OPTIONS)[number];
type DateDisplay = ReturnType<typeof getDateTimeDisplay>;

function ToolboxIcon(props: ComponentProps<typeof TriangleAlert>) {
  return <Icon iconNode={toolbox2} {...props} />;
}

function areFindingsEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

function IssueFindingsSelect({ issue }: { issue: IssueFeedCardIssue }) {
  const savedFindings = issue.resolution?.findings ?? [];
  const [selectedFindings, setSelectedFindings] = useState<string[]>(savedFindings);
  const [savingFindings, setSavingFindings] = useState(false);
  const savedFindingsRef = useRef<string[]>(savedFindings);
  const [firstFinding] = selectedFindings;
  const hiddenFindingsCount = Math.max(selectedFindings.length - 1, 0);

  const setIssueFindings = useMutation(api.core.issues.service.setIssueFindings);

  useEffect(() => {
    const nextFindings = issue.resolution?.findings ?? [];
    savedFindingsRef.current = nextFindings;
    setSelectedFindings(nextFindings);
  }, [issue.resolution?.findings]);

  const commitFindings = async () => {
    if (areFindingsEqual(selectedFindings, savedFindingsRef.current)) return;

    setSavingFindings(true);
    try {
      await setIssueFindings({
        _id: issue._id,
        findings: selectedFindings as FindingOption[],
      });
      savedFindingsRef.current = selectedFindings;
    } finally {
      setSavingFindings(false);
    }
  };

  return (
    <div className="mt-1 min-w-0 max-w-full">
      <MultiSelect
        modal={false}
        values={selectedFindings}
        onValuesChange={setSelectedFindings}
        onOpenChange={(open) => !open && commitFindings()}
      >
        <MultiSelectTrigger
          aria-label="Issue findings"
          title={selectedFindings.length ? selectedFindings.join(", ") : "Select findings"}
          className="min-h-7 max-w-full gap-1.5 border-zinc-700 bg-zinc-800/40 px-2 py-1 text-[11px] text-zinc-400 hover:bg-zinc-800/70"
          disabled={savingFindings}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <ClipboardCheck aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="shrink-0 font-medium">Findings</span>
          {firstFinding ? (
            <span className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="truncate">{firstFinding}</span>
              {hiddenFindingsCount > 0 && <span className="shrink-0 text-zinc-500">+{hiddenFindingsCount}</span>}
            </span>
          ) : (
            <span className="min-w-0 flex-1 truncate text-zinc-500">Select findings</span>
          )}
        </MultiSelectTrigger>
        <MultiSelectContent
          search={false}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {ISSUE_FINDINGS_OPTIONS.map((finding) => (
            <MultiSelectItem key={finding} value={finding}>
              {finding}
            </MultiSelectItem>
          ))}
        </MultiSelectContent>
      </MultiSelect>
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
    <FeedCardNote label="Resolution" comment={issue.resolution.comment}>
      <FeedCardMetadataList>
        <FeedCardMetadata icon={UserCheck} title={`Resolved by: ${issue.resolution.resolvedBy}`}>
          <span className="sr-only">Resolved by </span>
          {issue.resolution.resolvedBy}
        </FeedCardMetadata>
        {resolutionDateDisplay && (
          <FeedCardMetadata icon={Clock3} title={`Resolved: ${resolutionDateDisplay.dateAbsolute}`}>
            Resolved {resolutionDateDisplay.dateDaysAgo}
          </FeedCardMetadata>
        )}

        <IssueFindingsSelect issue={issue} />
      </FeedCardMetadataList>
    </FeedCardNote>
  );
}

function getOpenIssueStatus(issue: IssueFeedCardIssue) {
  if (issue.issue.sodId) return { stateText: `Escalated to MSE: ${issue.issue.sodId}`, stateTextClassName: "text-amber-400" };
  if (issue.issue.cruzfixId) return { stateText: `Escalated to CruzFix: ${issue.issue.cruzfixId}`, stateTextClassName: "text-amber-400" };
  if (issue.issue.onHold) return { stateText: "On hold", stateTextClassName: "text-zinc-400" };
}

function getIssueDisplayState(issue: IssueFeedCardIssue) {
  if (issue.resolution) {
    return {
      HeaderIcon: CheckCircle2,
      headerIconClassName: "border-emerald-500/20 bg-emerald-500/10",
      headerIconTextClassName: "text-emerald-400",
      stateIconNode: <IssueStatusIcon issue={issue} aria-hidden="true" className="size-3.5 shrink-0" />,
      stateTextClassName: "text-emerald-300",
    };
  }

  return {
    HeaderIcon: issue.issue.sodId ? ToolboxIcon : issue.issue.cruzfixId ? Drill : issue.issue.onHold ? OctagonPause : TriangleAlert,
    headerIconClassName: issue.issue.urgent ? "border-red-500/20 bg-red-500/10" : "border-amber-500/20 bg-amber-500/10",
    headerIconTextClassName: issue.issue.urgent ? "text-red-400" : "text-amber-400",
    stateIconNode: <IssueStatusIcon issue={issue} aria-hidden="true" className="size-3.5 shrink-0" />,
    ...getOpenIssueStatus(issue),
  };
}

export const IssueFeedCard = ({
  issue,
  classroom,
  className,
  ref,
  ...props
}: {
  issue: IssueFeedCardIssue;
  classroom?: Doc<"classrooms">;
} & React.HTMLAttributes<HTMLDivElement> & { ref?: RefObject<HTMLDivElement | null> }) => {
  const room = classroom;

  const reportedDateDisplay = getDateTimeDisplay(new Date(issue.issue.reportedAt));
  const resolutionDateDisplay = issue.resolution && getDateTimeDisplay(new Date(issue.resolution.resolvedAt));
  const { HeaderIcon, headerIconClassName, headerIconTextClassName, stateIconNode, stateText, stateTextClassName } = getIssueDisplayState(issue);
  const statusMetadata = stateText ? (
    <FeedCardMetadata iconNode={stateIconNode} className={cn("font-medium", stateTextClassName)}>
      {stateText}
    </FeedCardMetadata>
  ) : null;

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
        <div className="flex min-w-0 flex-1 items-center gap-3">
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
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1">
                <span className="font-bold text-lg text-zinc-100 leading-tight">{room?.displayName ?? "Unknown classroom"}</span>
                {room && <ClassroomAvailabilityPill room={room} />}
              </div>
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

      <FeedCardDetails
        label="Issue"
        description={issue.issue.description}
        metadata={
          <FeedCardMetadataList>
            {!issue.resolution && statusMetadata}
            <FeedCardMetadata icon={Clock3} title={`Reported: ${reportedDateDisplay.dateAbsolute}`}>
              Reported {reportedDateDisplay.dateDaysAgo}
            </FeedCardMetadata>
            <FeedCardMetadata icon={User} title={`Reported by: ${issue.issue.reportedBy}`}>
              <span className="sr-only">Reported by </span>
              {issue.issue.reportedBy}
            </FeedCardMetadata>
            {issue.resolution && statusMetadata}
          </FeedCardMetadataList>
        }
        note={issue.resolution && <IssueResolutionSection issue={issue} resolutionDateDisplay={resolutionDateDisplay || undefined} />}
      />
    </Card>
  );
};
