import type { attributeSchema, classroomSchema } from "@redwood/contracts";
import { Check } from "lucide-react";
import type { z } from "zod";
import { useAttributeStore } from "./attribute-store";

export function ClassroomCard({
  classroom,
  availableAttributes,
}: {
  classroom: z.infer<typeof classroomSchema>;
  availableAttributes: z.infer<typeof attributeSchema>[];
}) {
  const isSelected = useAttributeStore((state) => state.selectedClassroomIds.includes(classroom._id));
  const toggleSelectedClassroom = useAttributeStore((state) => state.toggleSelectedClassroom);

  const attributeMap = new Map(availableAttributes.map((attr) => [attr.label, attr]));

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
        <p className="mt-0.5 text-sm text-zinc-400">{classroom.groupKey}</p>
      </div>

      {classroom.attributes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {classroom.attributes.map((attrId) => {
            const attr = attributeMap.get(attrId);
            if (!attr) return null;

            return (
              <span
                key={attrId}
                className="rounded border px-2 py-0.5 font-medium text-xs transition-colors"
                style={{
                  backgroundColor: `${attr.color}15`,
                  color: attr.color,
                  borderColor: `${attr.color}40`,
                }}
              >
                {attr.label}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
