import { SidebarInset, SidebarProvider, SidebarTrigger } from "@redwood/shad-ui/components/sidebar";
import { Tabs, TabsContent } from "@redwood/shad-ui/components/tabs";
import { useEffect, useState } from "react";
import { type AppPane, AppSidebar } from "#/app/_components/app-sidebar.tsx";
import AdminPanel from "#/features/admin/components/admin-panel.tsx";
import { HotlinePage } from "#/features/hotline/hotline.tsx";
import { IssuesFeed } from "#/features/issues/components/feed/issues-feed.tsx";
import { TasksFeed } from "#/features/tasks/components/feed/tasks-feed.tsx";
import { authClientWeb } from "#/lib/auth-client-web.ts";
import { hasAdminAccess, hasSupervisorAccess } from "#/lib/permissions.ts";
import type { ClassroomSummary } from "../model/classroom-types";
import RoomList from "./list/room-list";
import { columns } from "./table/columns";
import Filters, { CompactFilters } from "./table/filters";
import { RoomTable } from "./table/room-table";

export default function HomePage({ rooms }: { rooms: ClassroomSummary[] }) {
  const { data } = authClientWeb.useSession();
  // biome-ignore lint/style/noNonNullAssertion: user must be logged in to see this page
  const session = data!;
  const canAccessAdminPanel = hasSupervisorAccess(session.user.role);
  const isAdmin = hasAdminAccess(session.user.role);

  const [activePane, setActivePane] = useState<AppPane>("classrooms");

  useEffect(() => {
    const storedPane = localStorage.getItem("lastTab") as AppPane | null;
    const validPanes: AppPane[] = ["classrooms", "issues", "tasks", "builder", "hotline", "admin"];

    if (storedPane && validPanes.includes(storedPane) && (storedPane !== "admin" || canAccessAdminPanel)) {
      setActivePane(storedPane);
    }
  }, [canAccessAdminPanel]);

  useEffect(() => {
    const panesByShortcut: Record<string, AppPane> = {
      "1": "classrooms",
      "2": "issues",
      "3": "tasks",
      "4": "builder",
      "5": "hotline",
      "6": "admin",
    };

    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      const pane = panesByShortcut[event.key];
      if (!pane || (pane === "admin" && !canAccessAdminPanel)) return;
      event.preventDefault();
      setActivePane(pane);
      localStorage.setItem("lastTab", pane);
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [canAccessAdminPanel]);

  const selectPane = (pane: AppPane) => {
    setActivePane(pane);
    localStorage.setItem("lastTab", pane);
  };

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar activePane={activePane} canAccessAdminPanel={canAccessAdminPanel} onPaneChange={selectPane} />
      <SidebarInset className="h-svh min-w-0 overflow-hidden font-sans text-white">
        <header className="flex h-14 shrink-0 items-center gap-3 border-border/70 border-b px-4 md:hidden">
          <SidebarTrigger className="size-8" />
          <span className="font-semibold capitalize">
            {activePane === "builder" ? "Shift Builder" : activePane === "admin" ? "Admin Panel" : activePane}
          </span>
          {activePane === "classrooms" && (
            <div className="ml-auto">
              <CompactFilters />
            </div>
          )}
        </header>

        <Tabs
          value={activePane}
          className="flex min-h-0 w-full flex-1 flex-col overflow-hidden"
          onValueChange={(value) => selectPane(value as AppPane)}
        >
          <TabsContent value="classrooms" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
            <div className="hidden w-full flex-1 items-center justify-center overflow-hidden p-5 lg:flex">
              <Filters />
              <RoomTable data={rooms} columns={columns} />
            </div>
            <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto p-4 lg:hidden">
              <RoomList data={rooms} />
            </div>
          </TabsContent>

          {/* TODO edit the CSS for appearing/disappearing bug / reloading cache bug */}
          <TabsContent value="issues" forceMount className="mt-0 flex min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden">
            <div className="flex w-full flex-1 overflow-hidden p-5">
              <IssuesFeed />
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
            <div className="flex w-full flex-1 overflow-hidden p-5">
              <TasksFeed />
            </div>
          </TabsContent>

          <TabsContent value="hotline" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
            <div className="flex w-full flex-1 items-center justify-center overflow-hidden p-5">
              <HotlinePage />
            </div>
          </TabsContent>

          <TabsContent value="builder" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
            <div className="flex w-full flex-1 items-center justify-center overflow-hidden p-5">
              <h1>Coming Soon to a Kerr Hall near you!</h1>
            </div>
          </TabsContent>

          {canAccessAdminPanel && (
            <TabsContent value="admin" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
              <div className="flex w-full flex-1 justify-center overflow-hidden p-5">
                <AdminPanel isAdmin={isAdmin} />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </SidebarInset>
    </SidebarProvider>
  );
}

// TODO display rooms in use of captioning
