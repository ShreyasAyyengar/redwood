"use client";

import { Building2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import type { HotlineTableItem } from "../table-types.ts";

export function LocationCell({ item }: { item: HotlineTableItem }) {
  const router = useRouter();

  if (!item.room) {
    return (
      <span className="flex min-w-0 items-start gap-2 text-zinc-300">
        <MapPin className="size-4 shrink-0 text-zinc-600" />
        <span className="whitespace-normal break-words text-sm leading-5">{item.entry.callerLocation}</span>
      </span>
    );
  }

  const href = `/classroom/${item.room._id}`;

  return (
    <button
      type="button"
      className="group/location flex min-w-0 items-start gap-2 rounded-md text-left font-medium text-sky-300 outline-none hover:text-sky-200 focus-visible:ring-2 focus-visible:ring-sky-400/50"
      onClick={(event) => {
        event.stopPropagation();
        router.push(href);
      }}
      onDoubleClick={(event) => event.stopPropagation()}
      onMouseEnter={() => router.prefetch(href)}
      title={`Open ${item.room.displayName}`}
    >
      <Building2 className="mt-0.5 size-4 shrink-0 text-sky-500" />
      <span className="whitespace-normal break-words border-sky-400/30 border-b text-sm leading-5 group-hover/location:border-sky-300">
        {item.room.displayName}
      </span>
    </button>
  );
}
