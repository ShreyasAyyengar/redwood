import { Skeleton } from "@redwood/shad-ui/components/skeleton";
import { Phone } from "lucide-react";

const SKELETON_ROW_KEYS = ["first", "second", "third", "fourth", "fifth", "sixth"];

export function HotlineTableSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {SKELETON_ROW_KEYS.map((key) => (
        <Skeleton key={key} className="h-20 w-full bg-zinc-800/70" />
      ))}
    </div>
  );
}

export function HotlineTableEmptyState() {
  return (
    <div className="flex h-72 flex-col items-center justify-center gap-3 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-500">
        <Phone className="size-6" />
      </div>
      <div>
        <p className="font-medium text-zinc-300">No hotline calls yet</p>
        <p className="mt-1 text-sm text-zinc-500">Press N to record the first call.</p>
      </div>
    </div>
  );
}
