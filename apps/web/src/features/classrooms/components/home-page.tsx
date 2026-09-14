import type { ClassroomSummary } from "../model/classroom-types";
import RoomList from "./list/room-list";
import { columns } from "./table/columns";
import Filters, { CompactFilters } from "./table/filters";
import { RoomTable } from "./table/room-table";

export default function HomePage({ rooms }: { rooms: ClassroomSummary[] }) {
  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden">
      <div className="hidden w-full flex-1 items-center justify-center overflow-hidden p-5 lg:flex">
        <Filters />
        <RoomTable data={rooms} columns={columns} />
      </div>
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto p-4 lg:hidden">
        <div className="mb-3 flex justify-end">
          <CompactFilters />
        </div>
        <RoomList data={rooms} />
      </div>
    </div>
  );
}

// TODO display rooms in use of captioning
