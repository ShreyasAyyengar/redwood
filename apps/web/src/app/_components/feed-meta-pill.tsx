import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@redwood/shad-ui/components/tooltip";
import { cn } from "@redwood/shad-ui/lib/utils";
import type { LucideIcon } from "lucide-react";

type FeedMetaPillProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  tooltip: string;
  tone?: "default" | "accent" | "danger" | "success";
  className?: string;
};

const toneStyles: Record<NonNullable<FeedMetaPillProps["tone"]>, string> = {
  default: "border-zinc-800/80 bg-zinc-950/60 text-zinc-300",
  accent: "border-indigo-500/20 bg-indigo-500/10 text-indigo-100",
  danger: "border-red-500/20 bg-red-500/10 text-red-100",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-100",
};

export function FeedMetaPill({ icon: Icon, label, value, tooltip, tone = "default", className }: FeedMetaPillProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] leading-none shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
              toneStyles[tone],
              className
            )}
          >
            <Icon className="size-3.5 opacity-80" />
            <span className="text-zinc-400">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
