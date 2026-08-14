import { api } from "@backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { useAttributeStore } from "../../model/attribute-store";
import { AttributeSelector } from "./attribute-selector";
import { ClassroomSelector } from "./classroom-selector";

export function AttributeEditor() {
  const { setClassrooms } = useAttributeStore();

  const rooms = useQuery(api.core.classrooms.service.getAllRooms, {});
  const attributes = useQuery(api.core.attributes.service.getAllAttributes, {});

  useEffect(() => {
    if (rooms) setClassrooms(rooms);
  }, [rooms, setClassrooms]);

  return (
    <div className="h-[calc(100vh-145px)] w-7xl pb-5 text-zinc-100">
      <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-h-0 lg:col-span-2">
          <ClassroomSelector availableAttributes={attributes ?? []} />
        </div>

        <div className="min-h-0 lg:col-span-1">
          <AttributeSelector availableAttributes={attributes ?? []} />
        </div>
      </div>
    </div>
  );
}
