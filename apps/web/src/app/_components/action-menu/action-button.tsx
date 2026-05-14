import { Button } from "@redwood/shad-ui/components/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@redwood/shad-ui/components/tooltip";
import { cn } from "@redwood/shad-ui/lib/utils";
import type { ComponentProps } from "react";

export type ActionButtonProps = Omit<ComponentProps<typeof Button>, "aria-label" | "size" | "type"> & {
  label: string;
};

export function ActionButton({ children, className, label, ...props }: ActionButtonProps) {
  return (
    <Button
      type="button"
      size="icon-lg"
      className={cn(
        "h-12 w-12 rounded-full border border-white/15 bg-zinc-900/95 text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] ring-1 ring-black/20 transition-all hover:bg-zinc-800 active:scale-95",
        className
      )}
      aria-label={label}
      {...props}
    >
      {children}
    </Button>
  );
}

type TooltipActionButtonProps = ActionButtonProps & {
  tooltip: string;
};

export function TooltipActionButton({ children, tooltip, ...props }: TooltipActionButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <ActionButton {...props}>{children}</ActionButton>
        </TooltipTrigger>
        <TooltipContent side="left" tooltipArrowClassName="bg-white fill-white" className="text-xl">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
