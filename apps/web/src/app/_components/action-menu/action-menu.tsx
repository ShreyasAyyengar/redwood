"use client";

import { Button } from "@redwood/shad-ui/components/button";
import { ArrowLeft, LogOut, MessageSquareText, Plus, Repeat2, X } from "lucide-react";
import { useState } from "react";
import { env } from "../../../env";
import { authClientWeb } from "../../../lib/auth-client-web";
import FeedbackDialog from "../feedback/feedback-dialog";
import { AccountAvatar } from "./account-avatar";
import { AccountSessionButton } from "./account-session-button";
import { ActionButton, TooltipActionButton } from "./action-button";
import { MenuItem } from "./menu-item";
import type { DeviceSession, MenuView } from "./types";

export default function ActionMenu() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<MenuView>("actions");
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

  const handleSwitchSession = (sessionToken: string) => {
    switchToSession(sessionToken).catch(() => undefined);
  };

  const addAccount = () => {
    closeMenu();
    authClientWeb.signIn.social({
      provider: "google",
      callbackURL: window.location.href,
      errorCallbackURL: `${env.NEXT_PUBLIC_WEBSITE_URL}/auth/error`,
    });
  };

  const signOut = () => {
    closeMenu();
    authClientWeb.signOut().catch(() => undefined);
  };

  const toggleMenu = () => {
    if (open) {
      closeMenu();
      return;
    }

    setOpen(true);
  };

  const renderAccountSessions = () => {
    if (isLoadingSessions) {
      return (
        <MenuItem isOpen={open}>
          <ActionButton label="Loading accounts" className="animate-pulse" disabled>
            <Repeat2 className="size-6!" />
          </ActionButton>
        </MenuItem>
      );
    }

    return deviceSessions.map((deviceSession) => (
      <MenuItem key={deviceSession.session.token} isOpen={open}>
        <AccountSessionButton activeSessionToken={activeSessionToken} deviceSession={deviceSession} onSwitchSession={handleSwitchSession} />
      </MenuItem>
    ));
  };

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
          <>
            <MenuItem isOpen={open}>
              <FeedbackDialog showTooltip={false}>
                <ActionButton label="Open feedback dialog" onClick={() => setOpen(false)}>
                  <MessageSquareText className="size-6!" />
                </ActionButton>
              </FeedbackDialog>
            </MenuItem>

            <MenuItem isOpen={open}>
              <TooltipActionButton label="Switch accounts" tooltip="Switch accounts" onClick={openAccounts}>
                <Repeat2 className="size-6!" />
              </TooltipActionButton>
            </MenuItem>

            <MenuItem isOpen={open}>
              <TooltipActionButton label="Log out" tooltip="Log out" onClick={signOut}>
                <LogOut className="size-6!" />
              </TooltipActionButton>
              {/*<ActionButton label="Log out" onClick={signOut}>*/}
              {/*  <LogOut className="size-6!" />*/}
              {/*</ActionButton>*/}
            </MenuItem>
          </>
        ) : (
          <>
            <MenuItem isOpen={open}>
              <ActionButton label="Back to profile actions" onClick={() => setView("actions")}>
                <ArrowLeft className="size-6!" />
              </ActionButton>
            </MenuItem>

            <MenuItem isOpen={open}>
              <ActionButton label="Add account" onClick={addAccount}>
                <Plus className="size-6!" />
              </ActionButton>
            </MenuItem>

            {renderAccountSessions()}
          </>
        )}

        <Button
          type="button"
          size="icon-lg"
          className={
            "h-12 w-12 overflow-hidden rounded-full border border-white/20 bg-zinc-800 p-0 text-white shadow-[0_10px_28px_rgba(0,0,0,0.5)] ring-1 ring-black/20 hover:bg-zinc-700 active:scale-95"
          }
          aria-label={open ? "Close profile menu" : "Open profile menu"}
          aria-expanded={open}
          onClick={toggleMenu}
        >
          {open ? <X className="size-6!" /> : <AccountAvatar account={user ?? {}} imageAlt={user?.name ?? "Signed in user"} />}
        </Button>
      </div>
    </div>
  );
}
