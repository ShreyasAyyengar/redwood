import { Tabs, TabsContent, TabsList, TabsTrigger } from "@redwood/shad-ui/components/tabs";
import { authClientWeb } from "../../lib/auth-client-web";
import RoomList from "./list/room-list";
import { useFetchedRoomsStore } from "./room-store";
import { columns } from "./table/columns";
import Filters from "./table/filters";
import { RoomTable } from "./table/room-table";

export default function HomePage() {
  const { fetchedRooms } = useFetchedRoomsStore();

  const { data } = authClientWeb.useSession();
  // biome-ignore lint/style/noNonNullAssertion: user must be logged in to see this page
  const session = data!;

  return (
    <>
      {/* Mobile Layout - Hidden on lg and above */}
      <div className="flex h-screen flex-col p-4 font-sans text-white lg:hidden">
        <h1 className="mb-4 text-center font-bold text-xl">Redwood</h1>
        <p className="mb-4 text-center text-sm">Classroom Maintenance</p>
        <RoomList data={fetchedRooms} />
      </div>

      {/* Desktop Layout - Hidden below lg */}
      <div className="hidden h-screen flex-col items-center justify-center font-sans text-white lg:flex">
        <p className="my-5 text-center font-bold text-3xl">Redwood</p>

        <Tabs defaultValue="classrooms" className="flex h-full flex-1 flex-col overflow-hidden">
          <TabsList className="mx-auto shrink-0">
            <TabsTrigger value="classrooms">Classrooms</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="builder">Shift Builder</TabsTrigger>
            {session.user.role === "admin" && <TabsTrigger value="admin">Admin Panel</TabsTrigger>}
          </TabsList>

          <TabsContent value="classrooms" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
            <div className="flex w-full flex-1 items-center justify-center overflow-hidden p-5">
              <Filters />
              <RoomTable data={fetchedRooms} columns={columns} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

// wTODO display rooms in use of captioning
