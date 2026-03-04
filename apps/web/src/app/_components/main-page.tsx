import { useFetchedRoomsStore } from "./room-store";
import { columns } from "./table/columns";
import { RoomTable } from "./table/room-table";

export default function MainPage() {
  const { fetchedRooms } = useFetchedRoomsStore();

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background font-sans text-white">
      <p className="mt-5 text-center font-bold text-3xl">Redwood — Classroom Maintenance </p>

      <div className="flex w-full flex-1 items-center justify-center overflow-hidden p-5">
        <RoomTable data={fetchedRooms} columns={columns} />
      </div>
    </div>
  );
}

// TODO display rooms in use of captioning
