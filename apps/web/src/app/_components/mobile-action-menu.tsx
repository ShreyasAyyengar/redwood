"use client";

import { Button } from "@redwood/shad-ui/components/button";
import { cn } from "@redwood/shad-ui/lib/utils";
import { Menu, MessageSquareText, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import FeedbackDialog from "./feedback/feedback-dialog";

const actionButtonClass =
  "h-12 w-12 rounded-full border border-white/15 bg-zinc-900/95 text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] ring-1 ring-black/20 transition-all hover:bg-zinc-800 active:scale-95";

type MobileAction = {
  id: string;
  label: string;
  render: () => ReactNode;
};

export default function MobileActionMenu() {
  const [open, setOpen] = useState(false);

  const actions: MobileAction[] = [
    {
      id: "feedback",
      label: "Feedback",
      render: () => (
        <FeedbackDialog showTooltip={false}>
          <Button type="button" size="icon-lg" className={actionButtonClass} aria-label="Open feedback dialog" onClick={() => setOpen(false)}>
            <MessageSquareText className="size-6!" />
          </Button>
        </FeedbackDialog>
      ),
    },
  ];

  return (
    // TODO extract top div into layout.tsx so it's not confusing and remains consistent with other floating icons
    <div className="fixed right-4 bottom-4 z-50 lg:hidden">
      {open && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 cursor-default bg-transparent p-0"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="relative z-50 flex flex-col items-end gap-3">
        {actions.map((action) => (
          <div
            key={action.id}
            className={cn(
              "transition-all duration-150",
              open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-95 opacity-0"
            )}
          >
            {action.render()}
          </div>
        ))}

        <Button
          type="button"
          size="icon-lg"
          className="h-12 w-12 rounded-full border border-white/20 bg-zinc-800 text-white shadow-[0_10px_28px_rgba(0,0,0,0.5)] ring-1 ring-black/20 hover:bg-zinc-700 active:scale-95"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X className="size-6!" /> : <Menu className="size-6!" />}
        </Button>
      </div>
    </div>
  );
}
