import type { Id } from "@backend/convex/_generated/dataModel";
import type { VisibilityRule } from "@backend/convex/core/maintenance/definitions";
import { Input } from "@redwood/shad-ui/components/input";
import { useState } from "react";
import { ChecklistSelect } from "#/features/maintenance/components/checklist-controls.tsx";

export type RuleRoom = { _id: Id<"classrooms">; displayName: string; attributes: Id<"attributes">[]; isActive: boolean };
export type RuleAttribute = { _id: Id<"attributes">; label: string };

function MultiChoice<T extends string>({
  label,
  choices,
  selected,
  onChange,
}: {
  label: string;
  choices: { id: T; label: string }[];
  selected: T[];
  onChange: (ids: T[]) => void;
}) {
  const [search, setSearch] = useState("");
  const known = new Set(choices.map((choice) => choice.id));
  const missing = selected.filter((id) => !known.has(id));
  return (
    <details className="rounded-md border border-zinc-700 bg-zinc-950/40 p-2 text-sm">
      <summary className="cursor-pointer text-zinc-300">
        {label} <span className="text-zinc-500">({selected.length})</span>
      </summary>
      <div className="mt-2 space-y-2">
        <Input
          aria-label={`Search ${label.toLowerCase()}`}
          placeholder="Search…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {choices
            .filter((choice) => choice.label.toLowerCase().includes(search.toLowerCase()))
            .map((choice) => (
              <label key={choice.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-zinc-800">
                <input
                  type="checkbox"
                  checked={selected.includes(choice.id)}
                  onChange={(event) => onChange(event.target.checked ? [...selected, choice.id] : selected.filter((id) => id !== choice.id))}
                />
                {choice.label}
              </label>
            ))}
          {missing.map((id) => (
            <label key={id} className="flex items-center gap-2 text-amber-300">
              <input type="checkbox" checked onChange={() => onChange(selected.filter((value) => value !== id))} />
              Deleted item — uncheck to remove
            </label>
          ))}
          {choices.length === 0 && <p className="text-zinc-500">No items available.</p>}
        </div>
      </div>
    </details>
  );
}

export function VisibilityEditor({
  rule,
  onChange,
  rooms,
  attributes,
}: {
  rule: VisibilityRule;
  onChange: (rule: VisibilityRule) => void;
  rooms: RuleRoom[];
  attributes: RuleAttribute[];
}) {
  const roomChoices = rooms.map((room) => ({ id: room._id, label: `${room.displayName}${room.isActive ? "" : " (archived)"}` }));
  const attributeChoices = attributes.map((attribute) => ({ id: attribute._id, label: attribute.label }));
  return (
    <div className="space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <ChecklistSelect
        label="Room audience"
        value={rule.audience}
        onChange={(event) => onChange({ ...rule, audience: event.target.value as VisibilityRule["audience"] })}
      >
        <option value="all">All classrooms</option>
        <option value="selected">Only selected classrooms</option>
      </ChecklistSelect>
      {rule.audience === "selected" && (
        <>
          <MultiChoice
            label="Included rooms"
            choices={roomChoices}
            selected={rule.roomIds}
            onChange={(roomIds) => onChange({ ...rule, roomIds })}
          />
          {rule.roomIds.length === 0 && <p className="text-xs text-amber-300">No rooms selected. This rule currently matches no rooms.</p>}
        </>
      )}
      <MultiChoice
        label="Exclude rooms"
        choices={roomChoices}
        selected={rule.excludeRoomIds}
        onChange={(excludeRoomIds) => onChange({ ...rule, excludeRoomIds })}
      />
      <MultiChoice
        label="Must have all attributes"
        choices={attributeChoices}
        selected={rule.allAttributeIds}
        onChange={(allAttributeIds) => onChange({ ...rule, allAttributeIds })}
      />
      <MultiChoice
        label="Must have any attribute"
        choices={attributeChoices}
        selected={rule.anyAttributeIds}
        onChange={(anyAttributeIds) => onChange({ ...rule, anyAttributeIds })}
      />
      <MultiChoice
        label="Must not have attributes"
        choices={attributeChoices}
        selected={rule.noneAttributeIds}
        onChange={(noneAttributeIds) => onChange({ ...rule, noneAttributeIds })}
      />
      <p className="text-xs text-zinc-500">Room and attribute conditions must all match. Exclusions always win within this rule.</p>
    </div>
  );
}
