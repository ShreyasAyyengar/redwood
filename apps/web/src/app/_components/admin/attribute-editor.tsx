import type { attributeSchema, classroomSchema } from "@redwood/contracts";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../../lib/orpc-web-client";

type AttributeEditorProps = {
  availableAttributes: z.infer<typeof attributeSchema>[];
  onApplyAttribute: (attributeId: string) => void;
  onRemoveAttribute: (attributeId: string) => void;
  selectedClassrooms: z.infer<typeof classroomSchema>[];
  selectedCount: number;
};

export function AttributeEditor({ selectedClassrooms, onApplyAttribute, onRemoveAttribute, selectedCount }: AttributeEditorProps) {
  const [availableAttributes, setAvailableAttributes] = useState<z.infer<typeof attributeSchema>[]>([]);

  const { data: attributes } = useQuery(webClientORPC.attributes.getAttributes.queryOptions());

  useEffect(() => {
    if (attributes) setAvailableAttributes(attributes);
  }, [attributes]);

  const getAttributeStats = (attributeId: string) => {
    if (selectedClassrooms.length === 0) return { count: 0, percentage: 0 };

    const count = selectedClassrooms.filter((classroom) => classroom.attributes.includes(attributeId)).length;

    const percentage = (count / selectedClassrooms.length) * 100;
    return { count, percentage };
  };

  const hasSelection = selectedCount > 0;

  return (
    <div className="sticky top-6 rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="mb-4 font-semibold text-gray-900 text-lg">Attribute Editor</h2>

      {!hasSelection ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div>
            <p className="font-medium text-amber-900 text-sm">No classrooms selected</p>
            <p className="mt-1 text-amber-700 text-xs">Select one or more classrooms to apply attributes</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-blue-900 text-sm">
              <span className="font-semibold">{selectedCount}</span> classroom{selectedCount !== 1 ? "s" : ""} selected
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="mb-3 font-medium text-gray-700 text-sm">Available Attributes</h3>

            {availableAttributes.map((attribute) => {
              const stats = getAttributeStats(attribute.label);
              const allHaveIt = stats.count === selectedClassrooms.length && stats.count > 0;
              const someHaveIt = stats.count > 0 && stats.count < selectedClassrooms.length;
              const noneHaveIt = stats.count === 0;

              return (
                <div key={attribute.label} className="rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`rounded border px-2 py-0.5 font-medium text-xs ${attribute.color}`}>{attribute.label}</span>
                      </div>

                      {/* Stats */}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                          <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${stats.percentage}%` }} />
                        </div>
                        <span className="whitespace-nowrap text-gray-600 text-xs">
                          {stats.count}/{selectedClassrooms.length}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1">
                      {!allHaveIt && (
                        <button
                          type="button"
                          onClick={() => onApplyAttribute(attribute.label)}
                          className="rounded bg-green-100 p-1.5 text-green-700 transition-colors hover:bg-green-200"
                          title="Add attribute"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      )}
                      {!noneHaveIt && (
                        <button
                          type="button"
                          onClick={() => onRemoveAttribute(attribute.label)}
                          className="rounded bg-red-100 p-1.5 text-red-700 transition-colors hover:bg-red-200"
                          title="Remove attribute"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Text */}
                  <p className="mt-2 text-gray-500 text-xs">
                    {allHaveIt && "All selected classrooms have this attribute"}
                    {someHaveIt && `${stats.count} of ${selectedClassrooms.length} selected have this`}
                    {noneHaveIt && "None of the selected classrooms have this"}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
