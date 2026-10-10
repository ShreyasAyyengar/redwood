import { cn } from "@redwood/shad-ui/lib/utils";
import { type LucideIcon, MessageSquare } from "lucide-react";
import type { ReactNode } from "react";

export function FeedCardMetadataList({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-col items-start gap-1.5 text-[11px] text-zinc-400">{children}</div>;
}

export function FeedCardDetails({
  label,
  description,
  metadata,
  note,
}: {
  label: string;
  description: string;
  metadata: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="@container min-w-0">
      <div
        className={cn(
          "grid min-w-0 @min-[640px]:gap-6 gap-4",
          note
            ? "@min-[640px]:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] border-zinc-800/80 border-t pt-3"
            : "@min-[640px]:grid-cols-[minmax(0,1fr)_220px]"
        )}
      >
        <section className="min-w-0" aria-label={label}>
          <p className="ml-1 whitespace-pre-wrap text-sm text-zinc-300 leading-relaxed [overflow-wrap:anywhere]">{description}</p>
          {note && <div className="mt-2.5">{metadata}</div>}
        </section>
        <div
          className={cn(
            "min-w-0 border-zinc-800/80",
            note
              ? "border-t @min-[640px]:border-t-0 @min-[640px]:border-l @min-[640px]:pt-0 pt-3 @min-[640px]:pl-6"
              : "flex flex-col justify-center @min-[640px]:border-l @min-[640px]:pl-4"
          )}
        >
          {note || metadata}
        </div>
      </div>
    </div>
  );
}

export function FeedCardMetadata({
  icon: Icon,
  iconNode,
  children,
  title,
  className,
}: {
  icon?: LucideIcon;
  iconNode?: ReactNode;
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex min-w-0 max-w-full items-center gap-1.5", className)} title={title}>
      {iconNode ?? (Icon && <Icon aria-hidden="true" className="size-3.5 shrink-0" />)}
      <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
    </span>
  );
}

export function FeedCardNote({ label, comment, children }: { label: string; comment?: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-2" aria-label={label}>
      <div className="flex items-center gap-1.5 font-medium text-[11px] text-emerald-400">
        <MessageSquare aria-hidden="true" className="size-3.5 shrink-0" />
        {label}
      </div>
      {comment && <p className="whitespace-pre-wrap text-[13px] text-zinc-300 leading-relaxed [overflow-wrap:anywhere]">{comment}</p>}
      {children}
    </section>
  );
}
