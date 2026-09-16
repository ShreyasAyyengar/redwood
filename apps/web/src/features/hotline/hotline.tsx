"use client";

import { api } from "@backend/convex/_generated/api";
import type { Doc } from "@backend/convex/_generated/dataModel";
import { Button } from "@redwood/shad-ui/components/button";
import { Kbd } from "@redwood/shad-ui/components/kbd";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@redwood/shad-ui/components/tabs";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { Phone, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { authClientWeb } from "#/lib/auth-client-web.ts";
import { hasAdminAccess, hasSupervisorAccess } from "#/lib/permissions.ts";
import { DutiesAvailabilityEditor } from "./components/duties/duties-availability-editor.tsx";
import { HotlineTable } from "./components/table/hotline-table.tsx";

const EMPTY_CATEGORIES: Doc<"hotlineCategories">[] = [];
const EMPTY_CLASSROOMS: Doc<"classrooms">[] = [];
const EMPTY_USERS: Array<{ email: string }> = [];

export function HotlinePage() {
  const { data: session } = authClientWeb.useSession();
  const isAdmin = hasAdminAccess(session?.user.role);
  const canManageCategories = hasSupervisorAccess(session?.user.role);
  const entries = useQuery(api.core.hotline.log.service.getHotlineEntries, {});
  const categories = useQuery(api.core.hotline.log.service.getHotlineCategories, {}) ?? EMPTY_CATEGORIES;
  const classrooms = useQuery(api.core.classrooms.service.getClassroomLookup, {}) ?? EMPTY_CLASSROOMS;
  const users = useQuery(api.core.users.service.getUsers, isAdmin ? {} : "skip") ?? EMPTY_USERS;
  const [activeTab, setActiveTab] = useState("log");
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

  const cancelActiveEntry = useCallback(() => {
    setIsCreating(false);
    setEditingEntry(undefined);
  }, []);

  const changeTab = useCallback(
    (tab: string) => {
      cancelActiveEntry();
      setActiveTab(tab);
    },
    [cancelActiveEntry]
  );

  useHotkey("N", openNewEntry, { enabled: activeTab === "log" && !editingEntry && !isCreating, ignoreInputs: true });
  useHotkey("Escape", cancelActiveEntry, { enabled: isCreating || Boolean(editingEntry), ignoreInputs: false });

  return (
    <Tabs
      value={activeTab}
      onValueChange={changeTab}
      className="flex h-full min-h-0 w-full flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-800 bg-neutral-900/95 shadow-2xl shadow-black/25"
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-zinc-800 border-b px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-sky-500/20 bg-sky-500/10 text-sky-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <Phone className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-xl text-zinc-100">Hotline</h2>
          </div>
        </div>

        <TabsList className="shrink-0 bg-zinc-950/60">
          <TabsTrigger value="log">Log</TabsTrigger>
          <TabsTrigger value="duties">Duties</TabsTrigger>
        </TabsList>

        <div className="flex min-w-32 shrink-0 justify-end">
          {activeTab === "log" && (
            <Button disabled={isCreating || Boolean(editingEntry)} onClick={openNewEntry} className="bg-sky-500 text-sky-950 hover:bg-sky-400">
              <Plus className="size-4" />
              New call
              <Kbd className="ml-1 bg-sky-950/15 text-sky-950">N</Kbd>
            </Button>
          )}
        </div>
      </div>

      <TabsContent value="log" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
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
          onCancelCreate={cancelActiveEntry}
          onCancelEdit={cancelActiveEntry}
          onCreateSuccess={() => setIsCreating(false)}
          onEditSuccess={() => setEditingEntry(undefined)}
          onEdit={openExistingEntry}
        />
      </TabsContent>

      <TabsContent value="duties" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
        <DutiesAvailabilityEditor defaultName={session?.user.name ?? ""} />
      </TabsContent>
    </Tabs>
  );
}
