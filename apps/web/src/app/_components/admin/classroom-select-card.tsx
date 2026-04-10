import type { attributeSchema, classroomSchema } from "@redwood/contracts";
import { Check } from "lucide-react";
import type { z } from "zod";

export function ClassroomCard({
  classroom,
  isSelected,
  onToggle,
  availableAttributes,
}: {
  classroom: z.infer<typeof classroomSchema>;
  isSelected: boolean;
  onToggle: () => void;
  availableAttributes: z.infer<typeof attributeSchema>[];
}) {
  const attributeMap = new Map(availableAttributes.map((attr) => [attr.label, attr]));

  return (
    <div
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }
      }}
      className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      {/* Checkbox */}
      <div className="absolute top-3 right-3">
        <div
          className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
            isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300 bg-white"
          }`}
        >
          {isSelected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
        </div>
      </div>

      {/* Classroom Info */}
      <div className="pr-8">
        <h3 className="font-semibold text-gray-900">{classroom.displayName}</h3>
        <p className="mt-0.5 text-gray-600 text-sm">{classroom.groupKey}</p>
      </div>

      {/* Attributes */}
      {classroom.attributes.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {classroom.attributes.map((attrId) => {
            const attr = attributeMap.get(attrId);
            if (!attr) return null;
            return (
              <span
                key={attrId}
                className={`rounded border px-2 py-0.5 font-medium text-xs bg-[${attr.color}/20] text-[${attr.color}] hover:bg-[${attr.color}]/30 border-[${attr.color}]/30`}
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
