import type { attributeSchema, classroomSchemaPayload } from "@redwood/contracts";
import { Badge } from "@redwood/shad-ui/components/badge";
import { Button } from "@redwood/shad-ui/components/button";
import { Field, FieldLabel } from "@redwood/shad-ui/components/field";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectGroup,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@redwood/shad-ui/components/multi-select";
import { cn } from "@redwood/shad-ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { z } from "zod";
import { webClientORPC } from "../../lib/orpc-web-client";
import { useFetchedRoomsStore } from "./room-store";

type BulkTargetAttribute = z.infer<typeof attributeSchema>;
type BulkTargetClassroom = z.infer<typeof classroomSchemaPayload>;

export type BulkTargetSummary = {
  attributeMatchedClassroomIds: BulkTargetClassroom["_id"][];
  duplicateClassroomIds: BulkTargetClassroom["_id"][];
  targetClassroomIds: BulkTargetClassroom["_id"][];
};

export function resolveBulkTargetClassroomIds({
  classrooms,
  selectedAttributeIds,
  selectedClassroomIds,
  allClassroomsSelected = false,
}: {
  classrooms: BulkTargetClassroom[];
  selectedAttributeIds: BulkTargetAttribute["_id"][];
  selectedClassroomIds: BulkTargetClassroom["_id"][];
  allClassroomsSelected?: boolean;
}): BulkTargetSummary {
  if (allClassroomsSelected) {
    return {
      attributeMatchedClassroomIds: [],
      duplicateClassroomIds: [],
      targetClassroomIds: classrooms.map((classroom) => classroom._id),
    };
  }

  const selectedAttributeIdSet = new Set(selectedAttributeIds);
  const selectedClassroomIdSet = new Set(selectedClassroomIds);

  const attributeMatchedClassroomIds = classrooms
    .filter((classroom) => classroom.attributes.some((attributeId) => selectedAttributeIdSet.has(attributeId)))
    .map((classroom) => classroom._id);

  const duplicateClassroomIds = attributeMatchedClassroomIds.filter((classroomId) => selectedClassroomIdSet.has(classroomId));
  const targetClassroomIds = Array.from(new Set([...attributeMatchedClassroomIds, ...selectedClassroomIds]));

  return {
    attributeMatchedClassroomIds,
    duplicateClassroomIds,
    targetClassroomIds,
  };
}

export function BulkTargetSelector({
  selectedAttributeIds,
  selectedClassroomIds,
  onAttributeIdsChange,
  onClassroomIdsChange,
  className,
  selectAllBehavior = "select-classroom-ids",
  allClassroomsSelected = false,
  onAllClassroomsSelectedChange,
}: {
  selectedAttributeIds: BulkTargetAttribute["_id"][];
  selectedClassroomIds: BulkTargetClassroom["_id"][];
  onAttributeIdsChange: (attributeIds: BulkTargetAttribute["_id"][]) => void;
  onClassroomIdsChange: (classroomIds: BulkTargetClassroom["_id"][]) => void;
  className?: string;
  selectAllBehavior?: "select-classroom-ids" | "empty-targets";
  allClassroomsSelected?: boolean;
  onAllClassroomsSelectedChange?: (selected: boolean) => void;
}) {
  const { fetchedRooms: classrooms } = useFetchedRoomsStore();
  const { data: attributes } = useQuery(webClientORPC.attributes.getAttributes.queryOptions({ enabled: true }));

  const { attributeMatchedClassroomIds, targetClassroomIds } = useMemo(
    () => resolveBulkTargetClassroomIds({ classrooms, selectedAttributeIds, selectedClassroomIds, allClassroomsSelected }),
    [allClassroomsSelected, classrooms, selectedAttributeIds, selectedClassroomIds]
  );

  const handleAttributeIdsChange = (attributeIds: BulkTargetAttribute["_id"][]) => {
    onAllClassroomsSelectedChange?.(false);
    onAttributeIdsChange(attributeIds);
  };

  const handleClassroomIdsChange = (classroomIds: BulkTargetClassroom["_id"][]) => {
    onAllClassroomsSelectedChange?.(false);
    onClassroomIdsChange(classroomIds);
  };

  const selectAllClassrooms = () => {
    if (selectAllBehavior === "empty-targets") {
      onAttributeIdsChange([]);
      onClassroomIdsChange([]);
      onAllClassroomsSelectedChange?.(true);
      return;
    }

    onClassroomIdsChange(classrooms.map((classroom) => classroom._id));
    onAllClassroomsSelectedChange?.(false);
  };

  const deselectAllTargets = () => {
    onAttributeIdsChange([]);
    onClassroomIdsChange([]);
    onAllClassroomsSelectedChange?.(false);
  };

  return (
    <div className={cn("rounded-lg border border-white/10 bg-zinc-950/30 p-4", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-lg">Target Classrooms</h3>
          <p className="text-muted-foreground text-sm">
            {allClassroomsSelected ? "All classrooms selected" : `${targetClassroomIds.length} classrooms selected`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={selectAllClassrooms}>
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={deselectAllTargets}>
            Deselect All
          </Button>
          {targetClassroomIds.length > 0 && (
            <Badge variant="outline" className="shrink-0 border-indigo-400/30 bg-indigo-400/10 text-indigo-100">
              {targetClassroomIds.length}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel className="font-semibold text-sm">Select Attributes</FieldLabel>
          <MultiSelect values={selectedAttributeIds} onValuesChange={handleAttributeIdsChange}>
            <MultiSelectTrigger className="w-full bg-zinc-950/40">
              <MultiSelectValue placeholder="Select attributes" overflowBehavior="cutoff" />
            </MultiSelectTrigger>
            <MultiSelectContent search={{ placeholder: "Search attributes...", emptyMessage: "No attributes found." }}>
              <MultiSelectGroup>
                {attributes?.map((attribute) => (
                  <MultiSelectItem key={attribute._id} value={attribute._id} badgeLabel={<AttributeLabel attribute={attribute} compact />}>
                    <AttributeLabel attribute={attribute} />
                  </MultiSelectItem>
                ))}
              </MultiSelectGroup>
            </MultiSelectContent>
          </MultiSelect>
          <span className="text-muted-foreground text-xs">{attributeMatchedClassroomIds.length} matched by attributes</span>
        </Field>

        <Field>
          <FieldLabel className="font-semibold text-sm">Select Classrooms</FieldLabel>
          <MultiSelect values={selectedClassroomIds} onValuesChange={handleClassroomIdsChange}>
            <MultiSelectTrigger className="w-full bg-zinc-950/40">
              <MultiSelectValue placeholder="Select classrooms" overflowBehavior="cutoff" />
            </MultiSelectTrigger>
            <MultiSelectContent search={{ placeholder: "Search classrooms...", emptyMessage: "No classrooms found." }}>
              <MultiSelectGroup>
                {classrooms.map((classroom) => (
                  <MultiSelectItem key={classroom._id} value={classroom._id}>
                    {classroom.displayName}
                  </MultiSelectItem>
                ))}
              </MultiSelectGroup>
            </MultiSelectContent>
          </MultiSelect>
          <span className="text-muted-foreground text-xs">
            {allClassroomsSelected ? "Stored as all classrooms for future rooms." : `${selectedClassroomIds.length} manually selected.`}
          </span>
        </Field>
      </div>
    </div>
  );
}

function AttributeLabel({ attribute, compact = false }: { attribute: BulkTargetAttribute; compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: attribute.color }} />
      <span className={cn("min-w-0 truncate", compact && "max-w-32")}>{attribute.label}</span>
    </span>
  );
}
