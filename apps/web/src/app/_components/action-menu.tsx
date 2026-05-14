"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@redwood/shad-ui/components/avatar";
import { Button } from "@redwood/shad-ui/components/button";
import { cn } from "@redwood/shad-ui/lib/utils";
import { ArrowLeft, LogOut, MessageSquareText, Plus, Repeat2, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { env } from "../../env";
import { authClientWeb } from "../../lib/auth-client-web";
import FeedbackDialog from "./feedback/feedback-dialog";

const actionButtonClass =
  "h-12 w-12 rounded-full border border-white/15 bg-zinc-900/95 text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] ring-1 ring-black/20 transition-all hover:bg-zinc-800 active:scale-95";

type MobileAction = {
  id: string;
  label: string;
  render: () => ReactNode;
};

type DeviceSession = {
  session: {
    token: string;
  };
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
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

export default function ActionMenu() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"actions" | "accounts">("actions");
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const { data: session } = authClientWeb.useSession();
  const user = session?.user;
  const activeSessionToken = session?.session.token;

  const closeMenu = () => {
    setOpen(false);
    setView("actions");
  };

  const openAccounts = async () => {
    setView("accounts");
    setIsLoadingSessions(true);
    try {
      const { data } = await authClientWeb.multiSession.listDeviceSessions();
      setDeviceSessions((data ?? []) as DeviceSession[]);
    } catch {
      setDeviceSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const switchToSession = async (sessionToken: string) => {
    if (sessionToken === activeSessionToken) {
      closeMenu();
      return;
    }

    await authClientWeb.multiSession.setActive({ sessionToken });
    closeMenu();
    window.location.reload();
  };

  const addAccount = () => {
    closeMenu();
    authClientWeb.signIn.social({
      provider: "google",
      callbackURL: window.location.href,
      errorCallbackURL: `${env.NEXT_PUBLIC_WEBSITE_URL}/auth/error`,
    });
  };

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
        <Button type="button" size="icon-lg" className={actionButtonClass} aria-label="Switch accounts" onClick={openAccounts}>
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
            closeMenu();
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
          onClick={closeMenu}
        />
      )}

      <div className="relative z-50 flex flex-col items-end gap-3">
        {view === "actions" ? (
          actions.map((action) => (
            <div
              key={action.id}
              className={cn(
                "transition-all duration-150",
                open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-95 opacity-0"
              )}
            >
              {action.render()}
            </div>
          ))
        ) : (
          <>
            <div
              className={cn(
                "transition-all duration-150",
                open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-95 opacity-0"
              )}
            >
              <Button
                type="button"
                size="icon-lg"
                className={actionButtonClass}
                aria-label="Back to profile actions"
                onClick={() => setView("actions")}
              >
                <ArrowLeft className="size-6!" />
              </Button>
            </div>

            <div
              className={cn(
                "transition-all duration-150",
                open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-95 opacity-0"
              )}
            >
              <Button type="button" size="icon-lg" className={actionButtonClass} aria-label="Add account" onClick={addAccount}>
                <Plus className="size-6!" />
              </Button>
            </div>

            {isLoadingSessions ? (
              <div
                className={cn(
                  "transition-all duration-150",
                  open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-95 opacity-0"
                )}
              >
                <Button type="button" size="icon-lg" className={cn(actionButtonClass, "animate-pulse")} aria-label="Loading accounts" disabled>
                  <Repeat2 className="size-6!" />
                </Button>
              </div>
            ) : (
              deviceSessions.map((deviceSession) => {
                const isActive = deviceSession.session.token === activeSessionToken;

                return (
                  <div
                    key={deviceSession.session.token}
                    className={cn(
                      "transition-all duration-150",
                      open ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-2 scale-95 opacity-0"
                    )}
                  >
                    <Button
                      type="button"
                      size="icon-lg"
                      className={cn(actionButtonClass, "overflow-hidden p-0", isActive && "border-emerald-400/70 ring-2 ring-emerald-400/40")}
                      aria-label={isActive ? "Current account" : `Switch to ${deviceSession.user.name ?? deviceSession.user.email ?? "account"}`}
                      onClick={() => {
                        switchToSession(deviceSession.session.token).catch(() => undefined);
                      }}
                    >
                      <Avatar className="size-full">
                        {deviceSession.user.image && <AvatarImage src={deviceSession.user.image} alt={deviceSession.user.name ?? "Account"} />}
                        <AvatarFallback className="bg-zinc-700 font-bold text-white text-xs">
                          {getInitials(deviceSession.user.name, deviceSession.user.email)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </div>
                );
              })
            )}
          </>
        )}

        <Button
          type="button"
          size="icon-lg"
          className="h-12 w-12 overflow-hidden rounded-full border border-white/20 bg-zinc-800 p-0 text-white shadow-[0_10px_28px_rgba(0,0,0,0.5)] ring-1 ring-black/20 hover:bg-zinc-700 active:scale-95"
          aria-label={open ? "Close profile menu" : "Open profile menu"}
          aria-expanded={open}
          onClick={() => {
            if (open) {
              closeMenu();
            } else {
              setOpen(true);
            }
          }}
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
