import type { classroomSchema, maintenanceEntrySchema } from "@redwood/contracts";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@redwood/shad-ui/components/tooltip";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CalendarDays, ClipboardClock, UserCog } from "lucide-react";
import { useCallback, useState } from "react";
import type { z } from "zod";
import { formatDate, getDateTimeDisplay } from "../../../../util/date-time-utils";
import MaintenanceDialog from "./maintenance/maintenance-dialog";

export default function MaintenanceHistory({
  history,
  room,
}: {
  history?: z.infer<typeof maintenanceEntrySchema>[];
  room: z.infer<typeof classroomSchema>;
}) {
  const [viewportElement, setViewportElement] = useState<HTMLDivElement | null>(null);

  const viewportRef = useCallback((node: HTMLDivElement | null) => {
    setViewportElement((prev) => (prev === node ? prev : node));
  }, []);

  const rowVirtualizer = useVirtualizer({
    count: history?.length ?? 0,
    getScrollElement: () => viewportElement,
    estimateSize: () => 140, // estimate high, not exact
    overscan: 3,
    getItemKey: (index) => history?.[index]?._id ?? index,
  });

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-neutral-900/95 p-5 font-bold text-xl text-zinc-300/80 shadow-xl/80 sm:text-2xl">
      <div className="flex items-center">
        <ClipboardClock className="mr-2 h-6 w-6 text-amber-400" />
        <div>Maintenance History</div>
      </div>

      <ScrollArea className="mt-3 h-full min-h-0 flex-1 rounded-2xl bg-zinc-950/50 p-3" viewportRef={viewportRef}>
        <TooltipProvider skipDelayDuration={0}>
          <div
            className="mt-1"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
              width: "100%",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              const entry = history?.[virtualItem.index];
              if (!entry) return null;

              const date = new Date(entry.date);
              const formatDateShort = formatDate(date);
              const { dateAbsolute } = getDateTimeDisplay(date);

              const who = entry.completedBy.split("@")[0];

              const microphoneEntries = entry.microphone ? Object.entries(entry.microphone) : [];
              const dtenEntries = entry.dten ? Object.entries(entry.dten) : [];
              const allChecks = [...microphoneEntries, ...dtenEntries];

              const issueChecks = allChecks.filter(([, value]) => value === "No, issue preventing completion");
              const taskChecks = allChecks.filter(([, value]) => value === "No, task created for completion");
              const fixedChecks = allChecks.filter(
                ([, value]) =>
                  typeof value === "string" &&
                  (value.startsWith("Re-") || value.includes("Battery replaced") || value.includes("now re-charging"))
              );

              const hasIssues = issueChecks.length > 0;
              const hasTasks = taskChecks.length > 0;
              const hasFixes = fixedChecks.length > 0;

              const overallTone = hasIssues
                ? "border-red-500/30 hover:border-red-400/40"
                : hasTasks
                  ? "border-amber-500/30 hover:border-amber-400/40"
                  : "border-emerald-500/20 hover:border-emerald-400/30";

              const leftAccent = hasIssues
                ? "bg-red-500/70 group-hover:bg-red-400/90"
                : hasTasks
                  ? "bg-amber-500/70 group-hover:bg-amber-400/90"
                  : "bg-emerald-500/60 group-hover:bg-emerald-400/80";

              return (
                <div
                  key={virtualItem.key}
                  data-index={virtualItem.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualItem.start}px)`,
                    paddingBottom: "8px", // replaces old space-y-2
                  }}
                >
                  <Tooltip delayDuration={500}>
                    <MaintenanceDialog roomId={room._id} maintenanceEntry={entry}>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "group relative cursor-pointer overflow-hidden rounded-xl border bg-neutral-800/70 px-3 py-3",
                            "shadow-sm transition-all duration-200 hover:bg-neutral-800/90 hover:shadow-md",
                            "duration-150 active:scale-95 active:transform",
                            overallTone
                          )}
                        >
                          <div className={cn("absolute inset-y-0 left-0 w-1 transition-all duration-200", leftAccent)} />

                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="size-5 text-neutral-400" />

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="font-semibold text-base text-neutral-100 sm:text-lg">{formatDateShort}</div>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-zinc-900 fill-zinc-900" tooltipArrowClassName="bg-zinc-900 fill-zinc-900">
                                    <p className="font-bold text-neutral-300 text-sm">{dateAbsolute}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>

                              <div className="mt-1 flex items-center gap-1 text-neutral-400 text-xs sm:text-sm">
                                <UserCog className="size-5 text-neutral-400" />
                                <span className="inline-flex h-5 items-center rounded-md bg-neutral-500/15 px-2 font-mono text-neutral-300">
                                  {who}
                                </span>
                              </div>
                            </div>

                            <div className="flex shrink-0 flex-col flex-wrap items-end justify-end space-y-1">
                              {!hasIssues && !hasTasks && (
                                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 font-semibold text-[11px] text-emerald-300">
                                  clean pass
                                </span>
                              )}

                              {hasIssues && (
                                <div className="flex text-sm">
                                  <span className="rounded-md rounded-r-none border border-red-500/30 border-r-0 bg-red-500/15 px-2 py-0.5 font-semibold text-[11px] text-red-300">
                                    {issueChecks.length} blocked
                                  </span>
                                  <span className="rounded-md rounded-l-none border border-red-500/30 bg-red-500/15 px-2 py-0.5 font-semibold text-[11px] text-red-300">
                                    {issueChecks
                                      .slice(0, 1)
                                      .map(([key]) => key)
                                      .join(", ")}
                                    {issueChecks.length > 1 ? ` +${issueChecks.length - 1} more` : ""}
                                  </span>
                                </div>
                              )}

                              {hasTasks && (
                                <div className="flex text-sm">
                                  <span className="rounded-md rounded-r-none border border-amber-500/30 border-r-0 bg-amber-500/15 px-2 py-0.5 font-semibold text-[11px] text-amber-300">
                                    {taskChecks.length} follow-up
                                  </span>
                                  <span className="rounded-md rounded-l-none border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 font-semibold text-[11px] text-amber-300">
                                    {taskChecks
                                      .slice(0, 1)
                                      .map(([key]) => key)
                                      .join(", ")}
                                    {taskChecks.length > 1 ? ` +${taskChecks.length - 1} more` : ""}
                                  </span>
                                </div>
                              )}

                              {hasFixes && (
                                <div className="flex text-sm">
                                  <span className="rounded-md rounded-r-none border border-sky-500/30 border-r-0 bg-sky-500/15 px-2 py-0.5 font-semibold text-[11px] text-sky-300">
                                    {fixedChecks.length} corrected
                                  </span>
                                  <span className="rounded-md rounded-l-none border border-sky-500/30 bg-sky-500/15 px-2 py-0.5 font-semibold text-[11px] text-sky-300">
                                    {fixedChecks
                                      .slice(0, 1)
                                      .map(([key]) => key)
                                      .join(", ")}
                                    {fixedChecks.length > 1 ? ` +${fixedChecks.length - 1} more` : ""}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex w-fit flex-col flex-wrap space-y-1.5">
                            {(!entry.surfacesWiped || !entry.equipmentChecked) && (
                              <div className="mt-3 flex items-center gap-2">
                                <span
                                  className={cn(
                                    "w-fit rounded-md px-2 py-1 font-semibold text-[11px]",
                                    entry.surfacesWiped ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                                  )}
                                >
                                  Surfaces {entry.surfacesWiped ? "wiped" : "not wiped"}
                                </span>
                                <span
                                  className={cn(
                                    "w-fit rounded-md px-2 py-1 font-semibold text-[11px]",
                                    entry.equipmentChecked ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"
                                  )}
                                >
                                  Equipment {entry.equipmentChecked ? "checked" : "not checked"}
                                </span>
                              </div>
                            )}

                            {(entry.microphone || entry.dten) && (
                              <div className="flex items-center gap-2">
                                {entry.microphone && (
                                  <span className="w-fit rounded-md bg-neutral-700/70 px-2 py-1 font-semibold text-[11px] text-neutral-200">
                                    Mic checked
                                  </span>
                                )}
                                {entry.dten && (
                                  <span className="w-fit rounded-md bg-neutral-700/70 px-2 py-1 font-semibold text-[11px] text-neutral-200">
                                    DTEN checked
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </TooltipTrigger>
                    </MaintenanceDialog>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      </ScrollArea>
    </div>
  );
}
