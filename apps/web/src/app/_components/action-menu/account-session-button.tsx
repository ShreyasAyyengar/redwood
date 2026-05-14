import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@redwood/shad-ui/components/tooltip";
import { cn } from "@redwood/shad-ui/lib/utils";
import { AccountAvatar } from "./account-avatar";
import { ActionButton } from "./action-button";
import type { DeviceSession } from "./types";

type AccountSessionButtonProps = {
  activeSessionToken?: string;
  deviceSession: DeviceSession;
  onSwitchSession: (sessionToken: string) => void;
};

export function AccountSessionButton({ activeSessionToken, deviceSession, onSwitchSession }: AccountSessionButtonProps) {
  const isActive = deviceSession.session.token === activeSessionToken;
  const accountLabel = deviceSession.user.name ?? deviceSession.user.email ?? "account";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <ActionButton
            label={isActive ? "Current account" : `Switch to ${accountLabel}`}
            className={cn("overflow-hidden p-0", isActive && "border-emerald-400/70 ring-2 ring-emerald-400/40")}
            onClick={() => onSwitchSession(deviceSession.session.token)}
          >
            <AccountAvatar account={deviceSession.user} imageAlt={deviceSession.user.name ?? "Account"} />
          </ActionButton>
        </TooltipTrigger>
        <TooltipContent side="left" tooltipArrowClassName="bg-white fill-white" className="text-xl">
          {deviceSession.user.name ?? deviceSession.user.email}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
