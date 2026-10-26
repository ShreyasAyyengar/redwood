"use client";

import { api } from "@backend/convex/_generated/api";
import { Button } from "@redwood/shad-ui/components/button";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MediaCodeDialog } from "./media-code-dialog.tsx";

export function MediaCode({ canEdit }: { canEdit: boolean }) {
  const settings = useQuery(api.core.hotline.settings.service.getHotlineSettings, {});
  const [isEditing, setIsEditing] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      clearTimeout(resetTimer.current);
    },
    []
  );

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-zinc-700/60 bg-zinc-950/40 px-3 py-1.5">
        <span className="shrink-0 font-medium text-md text-zinc-400">Media Code: </span>
        {settings === undefined ? (
          <span className="text-xs text-zinc-500">Loading…</span>
        ) : settings ? (
          <div className="flex items-center gap-2">
            <span className="select-text break-all font-mono font-semibold text-md text-sky-200 tracking-wider">{settings.mediaCode}</span>
            <span className="truncate text-xs text-zinc-500" title={settings.quarterLabel}>
              ({settings.quarterLabel})
            </span>
          </div>
        ) : (
          <span className="text-xs text-zinc-500">Not set</span>
        )}
        {canEdit && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={settings === undefined}
            className="h-7 px-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            onClick={() => setIsEditing(true)}
            aria-label={settings ? "Edit media code" : "Set media code"}
          >
            <Pencil className="size-3" />
            {settings ? "Edit" : "Set code"}
          </Button>
        )}
      </div>
      {canEdit && isEditing && settings !== undefined && <MediaCodeDialog settings={settings} onClose={() => setIsEditing(false)} />}
    </div>
  );
}
