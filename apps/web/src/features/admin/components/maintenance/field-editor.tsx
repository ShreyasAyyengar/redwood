import { allRoomsRule, type MaintenanceField, type MaintenanceOutcome } from "@backend/convex/core/maintenance/definitions";
import { Button } from "@redwood/shad-ui/components/button";
import { Input } from "@redwood/shad-ui/components/input";
import { Textarea } from "@redwood/shad-ui/components/textarea";
import { ChecklistSelect, resultLabels } from "#/features/maintenance/components/checklist-controls.tsx";
import { type RuleAttribute, type RuleRoom, VisibilityEditor } from "./visibility-editor";

export function newMaintenanceField(type: MaintenanceField["type"] = "dropdown"): MaintenanceField {
  const base = {
    id: crypto.randomUUID(),
    label: "New field",
    helpText: "",
    enabled: true,
    required: true,
    visibility: { mode: "inherit" as const, rules: allRoomsRule() },
  };
  if (type === "switch")
    return { ...base, type, trueOutcome: { result: "pass", followUp: "none" }, falseOutcome: { result: "follow_up", followUp: "none" } };
  if (type === "text") return { ...base, type, required: false };
  return {
    ...base,
    type,
    options: [
      { id: crypto.randomUUID(), label: "Pass", outcome: { result: "pass", followUp: "none" } },
      { id: crypto.randomUUID(), label: "Needs follow-up", outcome: { result: "follow_up", followUp: "task" } },
      { id: crypto.randomUUID(), label: "Blocked", outcome: { result: "blocked", followUp: "issue" } },
    ],
  };
}

function OutcomeEditor({
  label,
  outcome,
  onChange,
}: {
  label: string;
  outcome: MaintenanceOutcome;
  onChange: (value: MaintenanceOutcome) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <ChecklistSelect
        label={`${label} result`}
        value={outcome.result}
        onChange={(event) => onChange({ ...outcome, result: event.target.value as MaintenanceOutcome["result"] })}
      >
        {Object.entries(resultLabels).map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </ChecklistSelect>
      <ChecklistSelect
        label="Required follow-up link"
        value={outcome.followUp}
        onChange={(event) => onChange({ ...outcome, followUp: event.target.value as MaintenanceOutcome["followUp"] })}
      >
        <option value="none">None</option>
        <option value="task">Link a task</option>
        <option value="issue">Link an issue</option>
      </ChecklistSelect>
    </div>
  );
}

export function FieldEditor({
  field,
  onChange,
  rooms,
  attributes,
}: {
  field: MaintenanceField;
  onChange: (field: MaintenanceField) => void;
  rooms: RuleRoom[];
  attributes: RuleAttribute[];
}) {
  function changeType(type: MaintenanceField["type"]) {
    const { id, label, helpText, enabled, required, visibility } = field;
    onChange({ ...newMaintenanceField(type), id, label, helpText, enabled, required, visibility });
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <label className="space-y-1.5 text-sm">
          <span>Field label</span>
          <Input maxLength={160} value={field.label} onChange={(event) => onChange({ ...field, label: event.target.value })} />
        </label>
        <ChecklistSelect label="Input type" value={field.type} onChange={(event) => changeType(event.target.value as MaintenanceField["type"])}>
          <option value="dropdown">Dropdown</option>
          <option value="switch">Switch / Yes–No</option>
          <option value="text">Text</option>
        </ChecklistSelect>
      </div>
      <label className="block space-y-1.5 text-sm">
        <span>Instructions (optional)</span>
        <Textarea maxLength={2000} value={field.helpText} onChange={(event) => onChange({ ...field, helpText: event.target.value })} />
      </label>
      <div className="flex gap-5 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={field.enabled} onChange={(event) => onChange({ ...field, enabled: event.target.checked })} />
          Enabled
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={field.required} onChange={(event) => onChange({ ...field, required: event.target.checked })} />
          Required
        </label>
      </div>
      {field.type === "dropdown" && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Options and results</p>
          {field.options.map((option, index) => (
            <div key={option.id} className="space-y-3 rounded-lg border border-zinc-700 p-3">
              <div className="flex gap-2">
                <Input
                  aria-label={`Option ${index + 1} label`}
                  maxLength={160}
                  value={option.label}
                  onChange={(event) =>
                    onChange({
                      ...field,
                      options: field.options.map((item) => (item.id === option.id ? { ...item, label: event.target.value } : item)),
                    })
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={index === 0}
                  aria-label="Move option up"
                  onClick={() => {
                    const options = [...field.options];
                    options.splice(index - 1, 0, ...options.splice(index, 1));
                    onChange({ ...field, options });
                  }}
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove option ${option.label}`}
                  onClick={() => onChange({ ...field, options: field.options.filter((item) => item.id !== option.id) })}
                >
                  Remove
                </Button>
              </div>
              <OutcomeEditor
                label="Answer"
                outcome={option.outcome}
                onChange={(outcome) =>
                  onChange({ ...field, options: field.options.map((item) => (item.id === option.id ? { ...item, outcome } : item)) })
                }
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={field.options.length >= 30}
            onClick={() =>
              onChange({
                ...field,
                options: [...field.options, { id: crypto.randomUUID(), label: "New option", outcome: { result: "pass", followUp: "none" } }],
              })
            }
          >
            Add option
          </Button>
        </div>
      )}
      {field.type === "switch" && (
        <div className="space-y-3 rounded-lg border border-zinc-700 p-3">
          <OutcomeEditor label="Yes" outcome={field.trueOutcome} onChange={(trueOutcome) => onChange({ ...field, trueOutcome })} />
          <OutcomeEditor label="No" outcome={field.falseOutcome} onChange={(falseOutcome) => onChange({ ...field, falseOutcome })} />
        </div>
      )}
      {field.type === "text" && (
        <p className="text-sm text-zinc-400">
          Text is informational and does not affect the inspection result. Use a dropdown when an answer needs a scored result.
        </p>
      )}
      <ChecklistSelect
        label="Field visibility"
        value={field.visibility.mode}
        onChange={(event) =>
          onChange({ ...field, visibility: { ...field.visibility, mode: event.target.value as MaintenanceField["visibility"]["mode"] } })
        }
      >
        <option value="inherit">Use section rules</option>
        <option value="restrict">Restrict section rules</option>
        <option value="custom">Use custom rules</option>
      </ChecklistSelect>
      <p className="text-xs text-zinc-400">
        {field.visibility.mode === "inherit"
          ? "This field appears wherever its section applies."
          : field.visibility.mode === "restrict"
            ? "Both the section rules and the rules below must match."
            : "These rules replace section visibility. A disabled section still hides this field."}
      </p>
      {field.visibility.mode !== "inherit" && (
        <VisibilityEditor
          rule={field.visibility.rules}
          onChange={(rules) => onChange({ ...field, visibility: { ...field.visibility, rules } })}
          rooms={rooms}
          attributes={attributes}
        />
      )}
    </div>
  );
}
