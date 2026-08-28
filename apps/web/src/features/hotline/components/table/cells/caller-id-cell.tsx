"use client";

import { cn } from "@redwood/shad-ui/lib/utils";
import { useEffect, useRef, useState } from "react";

const COPY_FEEDBACK_DURATION_MS = 1500;

export function CallerIdCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      clearTimeout(resetTimer.current);
    },
    []
  );

  const copyCallerId = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      return;
    }
    setCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION_MS);
  };

  return (
    <button
      type="button"
      className={cn(
        "group/caller-id relative flex min-h-12 w-full cursor-copy items-center self-stretch rounded-md border border-transparent border-dotted px-2 text-left outline-none transition-[border-color,background-color,transform] duration-150 hover:border-zinc-500/70 hover:bg-zinc-800/70 focus-visible:border-zinc-400 focus-visible:bg-zinc-800/70 focus-visible:ring-2 focus-visible:ring-zinc-500/30 active:scale-[0.98]",
        copied && "border-emerald-400/70 bg-emerald-500/5 hover:border-emerald-400/70"
      )}
      onClick={async (event) => {
        event.stopPropagation();
        await copyCallerId();
      }}
      onDoubleClick={(event) => event.stopPropagation()}
      aria-label={copied ? "Caller ID copied" : `Copy caller ID ${value}`}
      title={copied ? "Copied" : "Click to copy caller ID"}
    >
      <span className="break-all text-left text-sm text-zinc-300 leading-5">{value}</span>
    </button>
  );
}
