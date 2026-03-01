import type { classroomSchema } from "@redwood/contracts";
import type { Row } from "@tanstack/react-table";
import type { z } from "zod";

export default function NameCell({ row }: { row: Row<z.infer<typeof classroomSchema>> }) {
  const displayName = row.original.displayName;
  const group = row.original.groupKey;
  return (
    <div className="flex flex-col items-start">
      <p className="font-bold text-lg text-white/80">{displayName}</p>
      {group && <p className="text-neutral-400 text-sm">{group}</p>}
    </div>
  );
}
