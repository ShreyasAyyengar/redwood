import { useFetchedRoomsStore } from "./room-store";
import { columns } from "./table/columns";
import { RoomTable } from "./table/room-table";

export default function MainPage() {
  const { fetchedRooms } = useFetchedRoomsStore();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background font-sans text-white">
      <RoomTable data={fetchedRooms} columns={columns} />
    </div>
  );
}

// TODO display rooms in use of captioning
