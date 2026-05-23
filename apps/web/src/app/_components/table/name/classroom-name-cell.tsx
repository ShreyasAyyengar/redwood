import type { classroomSchemaPayload } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { Popover, PopoverContent, PopoverTrigger } from "@redwood/shad-ui/components/popover";
import type { Row } from "@tanstack/react-table";
import { Computer, TvMinimal } from "lucide-react";
import type { z } from "zod";

export default function ClassroomNameCell({ row }: { row: Row<z.infer<typeof classroomSchemaPayload>> }) {
  const displayName = row.original.displayName;
  const group = row.original.groupKey;

  let captioningIcon: React.ReactNode = null;
  if (row.original.captioning?.isCaptioning) {
    captioningIcon = (
      <Popover>
        <PopoverTrigger>
          <Button
            variant="ghost"
            aria-label="Captioning device info"
            title="Captioning device info"
            className="p-2! text-zinc-400 hover:bg-zinc-900! active:scale-90 active:transform"
          >
            {row.original.captioning.type === "MAC" ? <TvMinimal className="size-5" /> : <Computer className="size-5" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-fit">
          <div className="w-full text-center font-semibold text-sm text-zinc-400 uppercase tracking-wide">Captioning Device: </div>

          <div className="mt-2 flex items-center justify-center gap-2">
            <div className="font-medium text-sm text-zinc-100">{row.original.captioning.type}</div>

            <div className="w-fit rounded-md bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-300">{row.original.captioning.identifier}</div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div className="flex w-full flex-col items-start">
      <div className="flex items-center">
        <p className="font-bold text-lg text-white/80">{displayName}</p>
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
          {captioningIcon}
        </span>
      </div>

      {group !== "Ungrouped" && <p className="text-neutral-400 text-sm">{group}</p>}
    </div>
  );
}
