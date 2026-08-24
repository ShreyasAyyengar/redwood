import { Tabs, TabsContent, TabsList, TabsTrigger } from "@redwood/shad-ui/components/tabs";
import Image from "next/image";
import AdminPanel from "#/features/admin/components/admin-panel.tsx";
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

  const storeLastTab = (tab: string) => localStorage.setItem("lastTab", tab);
  const storedTab = localStorage.getItem("lastTab");
  const lastTab = storedTab === "admin" && !canAccessAdminPanel ? "classrooms" : (storedTab ?? "classrooms");
  return (
    <>
      {/* Desktop Layout - Hidden below lg */}
      <div className="hidden h-screen flex-col items-center justify-center font-sans text-white lg:flex">
        <div className="my-5 flex items-center gap-5">
          <Image src="/redwood-icon.png" alt="Redwood Logo" className="h-8 w-8" height={32} width={32} />
          <p className="text-center font-bold text-3xl">Redwood</p>
        </div>

        <Tabs defaultValue={lastTab} className="flex h-full w-full flex-1 flex-col overflow-hidden" onValueChange={storeLastTab}>
          <TabsList className="mx-auto shrink-0">
            <TabsTrigger value="classrooms">Classrooms</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="builder">Shift Builder</TabsTrigger>
            {canAccessAdminPanel && <TabsTrigger value="admin">Admin Panel</TabsTrigger>}
          </TabsList>

          <TabsContent value="classrooms" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
            <div className="flex w-full flex-1 items-center justify-center overflow-hidden p-5 pt-0">
              <Filters />
              <RoomTable data={rooms} columns={columns} />
            </div>
          </TabsContent>

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
      </div>

      {/* Mobile Layout - Hidden on lg and above */}
      <div className="flex h-screen flex-col p-4 font-sans text-white lg:hidden">
        <div className="mb-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="col-start-2 flex min-w-0 items-center gap-3">
            <Image src="/redwood-icon.png" alt="Redwood Logo" className="h-8 w-8" height={32} width={32} />
            <p className="truncate font-bold text-3xl">Redwood</p>
          </div>
          <div className="col-start-3 justify-self-end">
            <CompactFilters />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <RoomList data={rooms} />
        </div>
      </div>
    </>
  );
}

// TODO display rooms in use of captioning
