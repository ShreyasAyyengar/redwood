import type { attributeSchema } from "@redwood/contracts";
import { Button } from "@redwood/shad-ui/components/button";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, Minus, Plus } from "lucide-react";
import type { z } from "zod";
import { webClientORPC } from "../../../../lib/orpc-web-client";
import AttributeDialog from "./attribute-dialog";
import { useAttributeStore } from "./attribute-store";

export function AttributeSelector({ availableAttributes }: { availableAttributes: z.infer<typeof attributeSchema>[] }) {
  const queryClient = useQueryClient();
  const { classrooms, selectedClassroomIds, applyAttribute, removeAttribute } = useAttributeStore();

  const selectedClassrooms = classrooms.filter((c) => selectedClassroomIds.includes(c._id));
  const selectedCount = selectedClassroomIds.length;
  const hasSelection = selectedCount > 0;

  const { mutate: bulkUpdate, isPending: isUpdating } = useMutation(
    webClientORPC.attributes.bulkUpdateClassrooms.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: webClientORPC.attributes.getAttributes.queryKey() });
        await queryClient.invalidateQueries({ queryKey: webClientORPC.classrooms.getRooms.queryKey() });
        useAttributeStore.getState().clearSelection();
      },
    })
  );

  const handleApplyBulk = () => {
    const updates = selectedClassrooms.map((c) => ({
      classroomId: c._id,
      attributes: c.attributes,
    }));
    bulkUpdate({ updates });
  };

  const getAttributeStats = (attributeId: string) => {
    if (selectedClassrooms.length === 0) return { count: 0, percentage: 0 };

    const count = selectedClassrooms.filter((classroom) => classroom.attributes.includes(attributeId)).length;

    const percentage = (count / selectedClassrooms.length) * 100;
    return { count, percentage };
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-zinc-800 bg-neutral-900 p-5">
      <h2 className="mb-4 font-semibold text-lg text-zinc-100">Attribute Editor</h2>
      <div className="mb-4 flex flex-col space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="font-medium text-md text-zinc-100">Available Attributes</h2>
          <AttributeDialog>
            <Button variant="outline" className="">
              <Plus className="h-4 w-4" />
            </Button>
          </AttributeDialog>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableAttributes.map((attribute) => (
            <AttributeDialog key={attribute._id} existingAttribute={attribute}>
              <span
                className="cursor-pointer rounded border px-2 py-0.5 font-medium text-xs transition-all hover:opacity-50"
                style={{
                  backgroundColor: `${attribute.color}15`,
                  color: attribute.color,
                  borderColor: `${attribute.color}40`,
                }}
              >
                {attribute.label}
              </span>
            </AttributeDialog>
          ))}
        </div>
      </div>
      {!hasSelection ? (
        <div className="flex items-start gap-3 rounded-lg border border-amber-800 bg-amber-950 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          <div>
            <p className="font-medium text-amber-100 text-sm">No classrooms selected</p>
            <p className="mt-1 text-amber-300 text-xs">Select one or more classrooms to apply attributes</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4 rounded-lg border border-blue-800 bg-blue-950/40 p-3">
            <p className="text-blue-100 text-sm">
              <span className="font-semibold">{selectedCount}</span> classroom{selectedCount !== 1 ? "s" : ""} selected
            </p>
          </div>

          <div className="min-h-0 flex-1">
            <ScrollArea className="h-full min-h-0 rounded-lg bg-zinc-950/50 p-3">
              {availableAttributes.length === 0 && selectedCount > 0 ? (
                <div className="flex items-start gap-3 rounded-lg border border-red-800 bg-red-950 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
                  <div>
                    <p className="font-medium text-red-100 text-sm">No attributes created</p>
                    <p className="mt-1 text-red-300 text-xs">Click the 'plus' button to create one.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableAttributes.map((attribute) => {
                    const stats = getAttributeStats(attribute._id);
                    const allHaveIt = stats.count === selectedClassrooms.length && stats.count > 0;
                    const someHaveIt = stats.count > 0 && stats.count < selectedClassrooms.length;
                    const noneHaveIt = stats.count === 0;

                    return (
                      <div
                        key={attribute._id}
                        className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 transition-colors hover:bg-zinc-800/50"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="rounded border px-2 py-0.5 font-medium text-xs transition-colors"
                                style={{
                                  backgroundColor: `${attribute.color}15`,
                                  color: attribute.color,
                                  borderColor: `${attribute.color}40`,
                                }}
                              >
                                {attribute.label}
                              </span>
                            </div>

                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
                                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${stats.percentage}%` }} />
                              </div>
                              <span className="whitespace-nowrap text-[10px] text-zinc-400">
                                {stats.count}/{selectedClassrooms.length}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-1">
                            {!allHaveIt && (
                              <button
                                type="button"
                                onClick={() => applyAttribute(attribute._id)}
                                className="rounded border border-emerald-800 bg-emerald-950 p-1.5 text-emerald-100 transition-colors hover:bg-emerald-900"
                                title="Add attribute"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            )}
                            {!noneHaveIt && (
                              <button
                                type="button"
                                onClick={() => removeAttribute(attribute._id)}
                                className="rounded border border-red-800 bg-red-950 p-1.5 text-red-100 transition-colors hover:bg-red-900"
                                title="Remove attribute"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="mt-2 text-[10px] text-zinc-500 italic">
                          {allHaveIt && "All selected rooms have this"}
                          {someHaveIt && `${stats.count} of ${selectedClassrooms.length} selected`}
                          {noneHaveIt && "None of the selected rooms have this"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>

          <div className="mt-6 border-zinc-800 border-t pt-4">
            <button
              type="button"
              onClick={handleApplyBulk}
              disabled={isUpdating || selectedCount === 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/40 px-4 py-2.5 font-semibold text-emerald-100 transition-all hover:bg-emerald-900/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply Changes"}
            </button>
            <p className="mt-2 text-center text-xs text-zinc-500">
              Saves changes to {selectedCount} room{selectedCount !== 1 ? "s" : ""}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
