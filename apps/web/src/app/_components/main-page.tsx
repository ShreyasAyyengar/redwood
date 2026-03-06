import RoomList from "./list/room-list";
import { useFetchedRoomsStore } from "./room-store";
import { columns } from "./table/columns";
import { RoomTable } from "./table/room-table";

export default function MainPage() {
  const { fetchedRooms } = useFetchedRoomsStore();

  return (
    <>
      {/* Mobile Layout - Hidden on xl and above */}
      <div className="flex h-screen flex-col bg-background p-4 font-sans text-white xl:hidden">
        <h1 className="mb-4 text-center font-bold text-xl">Redwood</h1>
        <p className="mb-4 text-center text-sm">Classroom Maintenance</p>
        <RoomList data={fetchedRooms} />
      </div>

      {/* Desktop Layout - Hidden below xl */}
      <div className="hidden h-screen flex-col items-center justify-center bg-background font-sans text-white xl:flex">
        <p className="mt-5 text-center font-bold text-3xl">Redwood — Classroom Maintenance</p>

        <div className="flex w-full flex-1 items-center justify-center overflow-hidden p-5">
          <RoomTable data={fetchedRooms} columns={columns} />
        </div>
      </div>
    </>
  );
}

// TODO display rooms in use of captioning
