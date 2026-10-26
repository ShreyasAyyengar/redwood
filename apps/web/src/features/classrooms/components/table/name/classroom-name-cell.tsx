import { Button } from "@redwood/shad-ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@redwood/shad-ui/components/popover";
import { cn } from "@redwood/shad-ui/lib/utils";
import type { LegacyRow as Row } from "@tanstack/react-table/legacy";
import { Computer, Copy, TvMinimal } from "lucide-react";
import { useRef, useState } from "react";
import type { ClassroomSummary } from "../../../model/classroom-types";

const COPY_FEEDBACK_DURATION_MS = 800;

export default function ClassroomNameCell({ row }: { row: Row<ClassroomSummary> }) {
  const { displayName } = row.original;
  const group = row.original.groupKey;

  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const copyCaptioningDevice = async () => {
    await navigator.clipboard.writeText(row.original.captioning?.identifier ?? "");

    setCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
  };

  return (
    <div className="flex w-full flex-col items-start">
      <div className="flex items-center">
        <p className="font-bold text-lg text-white/80">{displayName}</p>
        {row.original.captioning?.isCaptioningThisQuarter && (
          <span
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
              }
            }}
            className="ml-2"
          >
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  aria-label="Captioning device info"
                  title="Captioning device info"
                  className="p-2! text-zinc-400 hover:bg-zinc-900! active:scale-90 active:transform"
                >
                  {row.original.captioning.type === "MAC" ? <Computer className="size-5" /> : <TvMinimal className="size-5" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-fit"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  await copyCaptioningDevice();
                }}
              >
                <div className="w-full text-center font-semibold text-sm text-zinc-400 uppercase tracking-wide">Captioning Device</div>

                <div className="mt-2 flex items-center justify-center gap-1">
                  <div className="font-medium text-sm text-zinc-100">{row.original.captioning.type}:</div>

                  <div
                    className={cn(
                      "flex w-fit items-center gap-2 rounded-md border bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-300 transition active:scale-95",
                      copied ? "border-emerald-500" : "hover:border-cyan-700 hover:border-dashed"
                    )}
                  >
                    {row.original.captioning.identifier} <Copy className="size-3.5" />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </span>
        )}
      </div>

      {group !== "Ungrouped" && <p className="text-neutral-400 text-sm">{group}</p>}
    </div>
  );
}
