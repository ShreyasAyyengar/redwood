import { getAnswerOutcome } from "@backend/convex/core/maintenance/checklist";
import type { MaintenanceAnswer, MaintenanceField, MaintenanceOutcome, MaintenanceSection } from "@backend/convex/core/maintenance/definitions";
import { Button } from "@redwood/shad-ui/components/button";
import { Switch } from "@redwood/shad-ui/components/switch";
import { Textarea } from "@redwood/shad-ui/components/textarea";
import { type ReactNode, useId } from "react";
import { ChecklistSelect, resultLabels } from "./checklist-controls";

export function ChecklistFieldInput({
  field,
  answer,
  onChange,
  disabled = false,
}: {
  field: MaintenanceField;
  answer?: MaintenanceAnswer;
  onChange?: (answer: MaintenanceAnswer | undefined) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const label = `${field.label || "Untitled field"}${field.required ? " *" : " (optional)"}`;
  const value = answer?.value;
  const setValue = (next: string | boolean | undefined) => onChange?.(next === undefined ? undefined : { fieldId: field.id, value: next });
  return (
    <div className="space-y-2">
      {field.type === "dropdown" && (
        <ChecklistSelect
          label={label}
          aria-describedby={field.helpText ? `${id}-help` : undefined}
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value || undefined)}
        >
          <option value="">Choose an answer…</option>
          {field.options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label || "Untitled option"}
            </option>
          ))}
        </ChecklistSelect>
      )}
      {field.type === "switch" && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={id} className="text-sm text-zinc-200">
            {label}
          </label>
          <div className="flex items-center gap-2">
            <Switch
              id={id}
              checked={value === true}
              disabled={disabled}
              aria-describedby={field.helpText ? `${id}-help` : undefined}
              onCheckedChange={setValue}
            />
            <span className="text-xs text-zinc-400">{value === undefined ? "Not answered" : value ? "Yes" : "No"}</span>
            {!disabled && value === undefined && (
              <Button type="button" size="sm" variant="outline" onClick={() => setValue(false)}>
                Record No
              </Button>
            )}
            {!disabled && !field.required && value !== undefined && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setValue(undefined)}>
                Clear
              </Button>
            )}
          </div>
        </div>
      )}
      {field.type === "text" && (
        <label className="block space-y-2 text-sm text-zinc-200">
          <span>{label}</span>
          <Textarea
            maxLength={4000}
            aria-describedby={field.helpText ? `${id}-help` : undefined}
            value={typeof value === "string" ? value : ""}
            disabled={disabled}
            onChange={(event) => setValue(event.target.value || undefined)}
          />
        </label>
      )}
      {field.helpText && (
        <p id={`${id}-help`} className="text-xs whitespace-pre-line text-zinc-400">
          {field.helpText}
        </p>
      )}
    </div>
  );
}

export function ChecklistFields({
  sections,
  answers,
  onChange,
  disabled = false,
  renderFollowUp,
}: {
  sections: MaintenanceSection[];
  answers: MaintenanceAnswer[];
  onChange?: (fieldId: string, answer: MaintenanceAnswer | undefined) => void;
  disabled?: boolean;
  renderFollowUp?: (field: MaintenanceField, answer: MaintenanceAnswer | undefined) => ReactNode;
}) {
  return (
    <div className="space-y-5">
      {sections.map((section) => (
        <section key={section.id} className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">{section.label}</h3>
            {section.description && <p className="text-sm whitespace-pre-line text-zinc-400">{section.description}</p>}
          </div>
          <div className="space-y-5 rounded-lg border border-zinc-700/70 bg-zinc-950/30 p-4">
            {section.fields.map((field) => {
              const answer = answers.find((candidate) => candidate.fieldId === field.id);
              let outcome: MaintenanceOutcome | undefined;
              try {
                if (answer) outcome = getAnswerOutcome(field, answer.value);
              } catch {
                /* A draft may change while being previewed. */
              }
              return (
                <div key={field.id} className="space-y-2">
                  <ChecklistFieldInput field={field} answer={answer} onChange={(next) => onChange?.(field.id, next)} disabled={disabled} />
                  {outcome && (
                    <p className="text-xs text-zinc-400">
                      {resultLabels[outcome.result]}
                      {outcome.followUp !== "none" ? ` · ${outcome.followUp} link required` : ""}
                    </p>
                  )}
                  {renderFollowUp?.(field, answer)}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
