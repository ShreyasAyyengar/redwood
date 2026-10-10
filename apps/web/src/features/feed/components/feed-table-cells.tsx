"use client";

import type { Id } from "@backend/convex/_generated/dataModel";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@redwood/shad-ui/components/hover-card";
import { Building2 } from "lucide-react";
import Link from "next/link";

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

export function FeedDateCell({ value, overdue = false }: { value?: string; overdue?: boolean }) {
  if (!value) return <span className="text-zinc-600">—</span>;
  const date = new Date(value);
  return (
    <time dateTime={value} title={date.toLocaleString()} className={overdue ? "text-red-400" : "text-zinc-400"}>
      {dateFormatter.format(date)}
    </time>
  );
}

export function FeedTextCell({ value }: { value: string }) {
  return (
    <span className="block truncate" title={value}>
      {value}
    </span>
  );
}

export function FeedClassroomCell({ classroomId, name }: { classroomId: Id<"classrooms">; name: string }) {
  return (
    <Link
      href={`/classroom/${classroomId}`}
      className="group/classroom inline-flex min-w-0 max-w-full items-center gap-2 rounded-sm font-medium text-sky-300 outline-none hover:text-sky-200 focus-visible:ring-2 focus-visible:ring-sky-400/50"
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      title={`Open ${name}`}
    >
      <Building2 className="size-4 shrink-0 text-sky-500" />
      <span className="truncate border-sky-400/30 border-b group-hover/classroom:border-sky-300">{name}</span>
    </Link>
  );
}

export function FeedPreviewCell({ value, label, author, date }: { value?: string; label: string; author?: string; date?: string }) {
  if (!value) return <span className="text-zinc-600">—</span>;

  return (
    <HoverCard openDelay={750} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="block w-full truncate rounded-sm text-left outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
          aria-label={`${label}: ${value}`}
        >
          {value}
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="start" side="top" className="w-[min(24rem,calc(100vw-2rem))] space-y-2 border-zinc-700 bg-zinc-900 p-3">
        <p className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words text-sm text-zinc-300 leading-relaxed">{value}</p>
      </HoverCardContent>
    </HoverCard>
  );
}
