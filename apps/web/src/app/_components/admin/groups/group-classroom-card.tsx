import type { classroomSchema } from "@redwood/contracts";
import { Check } from "lucide-react";
import type { z } from "zod";
import { useGroupStore } from "./group-store";

export function GroupClassroomCard({ classroom }: { classroom: z.infer<typeof classroomSchema> }) {
  const isSelected = useGroupStore((state) => state.selectedClassroomIds.includes(classroom._id));
  const toggleSelectedClassroom = useGroupStore((state) => state.toggleSelectedClassroom);

  const handleToggle = () => {
    toggleSelectedClassroom(classroom._id);
  };

  return (
    <div
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          handleToggle();
        }
      }}
      className={`relative cursor-pointer rounded-lg border p-4 text-zinc-100 transition-all ${
        isSelected
          ? "border-blue-800 bg-blue-950/40 hover:border-blue-700"
          : "border-zinc-800 bg-neutral-900 hover:border-zinc-700 hover:bg-zinc-900"
      }`}
    >
      <div className="absolute top-3 right-3">
        <div
          className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
            isSelected ? "border-blue-700 bg-blue-800" : "border-zinc-700 bg-zinc-800"
          }`}
        >
          {isSelected && <Check className="h-3.5 w-3.5 text-blue-100" strokeWidth={3} />}
        </div>
      </div>

      <div className="pr-8">
        <h3 className="font-semibold text-zinc-100">{classroom.displayName}</h3>
        <p className="mt-0.5 text-sm text-zinc-400">
          Current Group:{" "}
          <span className="rounded border border-zinc-700 bg-zinc-950/50 px-2 py-0.5 font-medium text-[10px] text-zinc-300 transition-colors">
            {classroom.groupKey}
          </span>
        </p>
      </div>
    </div>
  );
}
