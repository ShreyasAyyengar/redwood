import { toolbox2 } from "@lucide/lab";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@redwood/shad-ui/components/hover-card";
import { Drill, Icon, OctagonPause, TriangleAlert, UserLock } from "lucide-react";
import type { ReactNode } from "react";

function StatusIndicator({ label, detail, children }: { label: string; detail: string; children: ReactNode }) {
  return (
    <HoverCard openDelay={150} closeDelay={50}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={`${label}: ${detail}`}
          className="inline-flex size-6 shrink-0 items-center justify-center rounded hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-zinc-400"
          onDoubleClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {children}
        </button>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-auto max-w-xs space-y-1 border-zinc-700 bg-zinc-900 p-3 text-xs">
        <p className="font-medium text-zinc-100">{label}</p>
        <p className="break-words text-zinc-400">{detail}</p>
      </HoverCardContent>
    </HoverCard>
  );
}

export function FeedStatusIndicators({
  urgent,
  supervisorNeeded,
  onHold = false,
  sodId,
  cruzfixId,
}: {
  urgent: boolean;
  supervisorNeeded: boolean;
  onHold?: boolean;
  sodId?: string;
  cruzfixId?: string;
}) {
  const sod = sodId?.trim();
  const cruzfix = cruzfixId?.trim();

  return (
    <div className="flex items-center gap-0.5">
      {urgent && (
        <StatusIndicator label="Urgent" detail="Needs urgent attention">
          <TriangleAlert className="size-4 text-red-400" />
        </StatusIndicator>
      )}
      {supervisorNeeded && (
        <StatusIndicator label="Supervisor required" detail="Requires supervisor assistance">
          <UserLock className="size-4 text-purple-400" />
        </StatusIndicator>
      )}
      {sod && (
        <StatusIndicator label="Escalated to MSE" detail={`SOD ID: ${sod}`}>
          <Icon iconNode={toolbox2} className="size-4 text-amber-400" />
        </StatusIndicator>
      )}
      {cruzfix && (
        <StatusIndicator label="CruzFix Created" detail={`CruzFix ID: ${cruzfix}`}>
          <Drill className="size-4 text-amber-400" />
        </StatusIndicator>
      )}
      {onHold && (
        <StatusIndicator label="On hold" detail="Work on this issue is paused">
          <OctagonPause className="size-4 text-zinc-400" />
        </StatusIndicator>
      )}
      {!(urgent || supervisorNeeded || sod || cruzfix || onHold) && (
        <span className="text-zinc-600">
          —<span className="sr-only">No status flags</span>
        </span>
      )}
    </div>
  );
}
