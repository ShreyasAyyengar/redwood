import type { attributeSchema } from "@redwood/contracts";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../../lib/orpc-web-client";
import { AttributeSelector } from "./attribute-selector";
import { useAttributeStore } from "./attribute-store";
import { ClassroomSelector } from "./classroom-selector";

export function AttributeEditor() {
  const [availableAttributes, setAvailableAttributes] = useState<z.infer<typeof attributeSchema>[]>([]);
  const { setClassrooms } = useAttributeStore();

  const { data: rooms } = useQuery(webClientORPC.classrooms.getRooms.queryOptions({}));
  const { data: attributes } = useQuery(webClientORPC.attributes.getAttributes.queryOptions());

  useEffect(() => {
    if (rooms) setClassrooms(rooms);
  }, [rooms, setClassrooms]);

  useEffect(() => {
    if (attributes) setAvailableAttributes(attributes);
  }, [attributes]);

  return (
    <div className="mx-auto max-w-7xl text-zinc-100">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Classrooms Section */}
        <div className="lg:col-span-2">
          <ClassroomSelector availableAttributes={availableAttributes} />
        </div>

        {/* Attribute Editor Section */}
        <div className="lg:col-span-1">
          <AttributeSelector availableAttributes={availableAttributes} />
        </div>
      </div>
    </div>
  );
}
