"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@redwood/shad-ui/components/avatar";
import { Button } from "@redwood/shad-ui/components/button";
import { cn } from "@redwood/shad-ui/lib/utils";
import { LogOut, MessageSquareText, Repeat2, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { authClientWeb } from "../../lib/auth-client-web";
import FeedbackDialog from "./feedback/feedback-dialog";

const actionButtonClass =
  "h-12 w-12 rounded-full border border-white/15 bg-zinc-900/95 text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] ring-1 ring-black/20 transition-all hover:bg-zinc-800 active:scale-95";

type MobileAction = {
  id: string;
  label: string;
  render: () => ReactNode;
};

const getInitials = (name?: string | null, email?: string | null) => {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  return email?.slice(0, 2).toUpperCase() ?? "RW";
};

export default function MobileActionMenu() {
  const [open, setOpen] = useState(false);
  const { data: session } = authClientWeb.useSession();
  const user = session?.user;

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
    {
      id: "switch-accounts",
      label: "Switch accounts",
      render: () => (
        <Button type="button" size="icon-lg" className={cn(actionButtonClass, "opacity-60")} aria-label="Switch accounts coming soon" disabled>
          <Repeat2 className="size-6!" />
        </Button>
      ),
    },
    {
      id: "logout",
      label: "Log out",
      render: () => (
        <Button
          type="button"
          size="icon-lg"
          className={actionButtonClass}
          aria-label="Log out"
          onClick={() => {
            setOpen(false);
            authClientWeb.signOut().catch(() => undefined);
          }}
        >
          <LogOut className="size-6!" />
        </Button>
      ),
    },
  ];

  return (
    <div className="fixed right-4 bottom-4 z-50">
      {open && (
        <button
          type="button"
          aria-label="Close profile menu"
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
          className="h-12 w-12 overflow-hidden rounded-full border border-white/20 bg-zinc-800 p-0 text-white shadow-[0_10px_28px_rgba(0,0,0,0.5)] ring-1 ring-black/20 hover:bg-zinc-700 active:scale-95"
          aria-label={open ? "Close profile menu" : "Open profile menu"}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? (
            <X className="size-6!" />
          ) : (
            <Avatar className="size-full">
              {user?.image && <AvatarImage src={user.image} alt={user.name ?? "Signed in user"} />}
              <AvatarFallback className="bg-zinc-700 font-bold text-white text-xs">{getInitials(user?.name, user?.email)}</AvatarFallback>
            </Avatar>
          )}
        </Button>
      </div>
    </div>
  );
}
