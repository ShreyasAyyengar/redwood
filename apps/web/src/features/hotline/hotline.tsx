"use client";

import { api } from "@backend/convex/_generated/api";
import type { Doc } from "@backend/convex/_generated/dataModel";
import { Button } from "@redwood/shad-ui/components/button";
import { Kbd } from "@redwood/shad-ui/components/kbd";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useQuery } from "convex/react";
import { Phone, Plus, Tags } from "lucide-react";
import { useCallback, useState } from "react";
import { authClientWeb } from "#/lib/auth-client-web.ts";
import { hasAdminAccess, hasSupervisorAccess } from "#/lib/permissions.ts";
import { HotlineTable } from "./components/table/hotline-table.tsx";

const EMPTY_CATEGORIES: Doc<"hotlineCategories">[] = [];
const EMPTY_CLASSROOMS: Doc<"classrooms">[] = [];
const EMPTY_USERS: Array<{ email: string }> = [];

export function HotlinePage() {
  const { data: session } = authClientWeb.useSession();
  const isAdmin = hasAdminAccess(session?.user.role);
  const canManageCategories = hasSupervisorAccess(session?.user.role);
  const entries = useQuery(api.core.hotline.service.getHotlineEntries, {});
  const categories = useQuery(api.core.hotline.service.getHotlineCategories, {}) ?? EMPTY_CATEGORIES;
  const classrooms = useQuery(api.core.classrooms.service.getClassroomLookup, {}) ?? EMPTY_CLASSROOMS;
  const users = useQuery(api.core.users.service.getUsers, isAdmin ? {} : "skip") ?? EMPTY_USERS;
  const [isCreating, setIsCreating] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Doc<"hotline">>();

  const openNewEntry = useCallback(() => {
    setEditingEntry(undefined);
    setIsCreating(true);
  }, []);

  const openExistingEntry = useCallback((entry: Doc<"hotline">) => {
    setIsCreating(false);
    setEditingEntry(entry);
  }, []);

  useHotkey("N", openNewEntry, { enabled: !editingEntry && !isCreating, ignoreInputs: true });

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-neutral-900/95 shadow-2xl shadow-black/25">
      <div className="flex shrink-0 items-center justify-between gap-4 border-zinc-800 border-b px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <Phone className="size-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-xl text-zinc-100">Hotline log</h2>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {categories.length === 0 && (
            <div className="hidden items-center gap-2 text-amber-400/80 text-xs xl:flex">
              <Tags className="size-4" />
              Add a category before saving a call
            </div>
          )}
          <Button disabled={isCreating || Boolean(editingEntry)} onClick={openNewEntry} className="bg-sky-500 text-sky-950 hover:bg-sky-400">
            <Plus className="size-4" />
            New call
            <Kbd className="ml-1 bg-sky-950/15 text-sky-950">N</Kbd>
          </Button>
        </div>
      </div>

      <HotlineTable
        canManageCategories={canManageCategories}
        entries={entries}
        categories={categories}
        classrooms={classrooms}
        users={users}
        currentUserEmail={session?.user.email ?? ""}
        editingEntry={editingEntry}
        isAdmin={isAdmin}
        isCreating={isCreating}
        onCancelCreate={() => setIsCreating(false)}
        onCancelEdit={() => setEditingEntry(undefined)}
        onCreateSuccess={() => setIsCreating(false)}
        onEditSuccess={() => setEditingEntry(undefined)}
        onEdit={openExistingEntry}
      />
    </div>
  );
}
