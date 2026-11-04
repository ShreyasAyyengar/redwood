import type { Id } from "../../_generated/dataModel";
import {
  type EvaluatedAnswer,
  MAX_CHECKLIST_FIELDS,
  MAX_TEMPLATE_BYTES,
  type MaintenanceAnswer,
  type MaintenanceField,
  type MaintenanceOutcome,
  type MaintenanceSection,
  type MaintenanceSummary,
  type VisibilityRule,
} from "./definitions";

export type ChecklistRoom = { _id: Id<"classrooms">; attributes: Id<"attributes">[] };

export function explainRule(rule: VisibilityRule, room: ChecklistRoom): string | null {
  if (rule.excludeRoomIds.includes(room._id)) return "This room is explicitly excluded.";
  if (rule.audience === "selected" && !rule.roomIds.includes(room._id)) return "This room is not in the selected rooms.";
  if (!rule.allAttributeIds.every((id) => room.attributes.includes(id))) return "This room is missing a required attribute.";
  if (rule.anyAttributeIds.length > 0 && !rule.anyAttributeIds.some((id) => room.attributes.includes(id)))
    return "This room has none of the alternative attributes.";
  if (rule.noneAttributeIds.some((id) => room.attributes.includes(id))) return "This room has an excluded attribute.";
  return null;
}

export function explainField(section: MaintenanceSection, field: MaintenanceField, room: ChecklistRoom): string | null {
  if (!section.enabled) return "This section is disabled.";
  if (!field.enabled) return "This field is disabled.";
  if (field.visibility.mode !== "custom") {
    const reason = explainRule(section.visibility, room);
    if (reason) return `Section rule: ${reason}`;
  }
  if (field.visibility.mode !== "inherit") return explainRule(field.visibility.rules, room);
  return null;
}

export function resolveChecklist(sections: MaintenanceSection[], room: ChecklistRoom): MaintenanceSection[] {
  return sections.flatMap((section) => {
    const fields = section.fields.filter((field) => explainField(section, field, room) === null);
    return fields.length ? [{ ...section, fields }] : [];
  });
}

// Sent back on submission to detect room/attribute changes while a form is open.
export function checklistContext(room: ChecklistRoom): string {
  return JSON.stringify([room._id, [...new Set(room.attributes)].sort()]);
}

export function getAnswerOutcome(field: MaintenanceField, value: MaintenanceAnswer["value"]): MaintenanceOutcome {
  if (field.type === "switch") {
    if (typeof value !== "boolean") throw new Error(`${field.label}: choose Yes or No.`);
    return value ? field.trueOutcome : field.falseOutcome;
  }
  if (typeof value !== "string") throw new Error(`${field.label}: invalid answer type.`);
  if (field.type === "text") return { result: "info", followUp: "none" };
  const option = field.options.find((candidate) => candidate.id === value);
  if (!option) throw new Error(`${field.label}: choose an available option.`);
  return option.outcome;
}

export function summarizeAnswers(answers: Pick<EvaluatedAnswer, "result">[]): MaintenanceSummary {
  const counts: Omit<MaintenanceSummary, "status"> = { pass: 0, corrected: 0, follow_up: 0, blocked: 0, info: 0, not_applicable: 0 };
  for (const answer of answers) counts[answer.result] += 1;
  const status =
    counts.blocked > 0
      ? "blocked"
      : counts.corrected > 0 || counts.follow_up > 0
        ? "corrective_actions"
        : counts.pass > 0
          ? "clean_pass"
          : "unscored";
  return { ...counts, status };
}

export function evaluateAnswers(sections: MaintenanceSection[], answers: MaintenanceAnswer[]): EvaluatedAnswer[] {
  const fields = new Map(sections.flatMap((section) => section.fields.map((field) => [field.id, field] as const)));
  const seen = new Set<string>();
  const evaluated: EvaluatedAnswer[] = [];
  for (const answer of answers) {
    if (seen.has(answer.fieldId)) throw new Error("A field was answered more than once.");
    seen.add(answer.fieldId);
    const field = fields.get(answer.fieldId);
    if (!field) throw new Error("An answer belongs to a field that is not applicable to this room.");
    const outcome = getAnswerOutcome(field, answer.value);
    if (typeof answer.value === "string" && !answer.value.trim()) {
      if (field.required) throw new Error(`${field.label}: an answer is required.`);
      continue;
    }
    if (outcome.followUp === "task" && !answer.taskId) throw new Error(`${field.label}: link a task before submitting.`);
    if (outcome.followUp === "issue" && !answer.issueId) throw new Error(`${field.label}: link an issue before submitting.`);
    if ((answer.taskId && outcome.followUp !== "task") || (answer.issueId && outcome.followUp !== "issue"))
      throw new Error(`${field.label}: the linked follow-up does not match this answer.`);
    const displayValue =
      field.type === "dropdown"
        ? (field.options.find((option) => option.id === answer.value)?.label ?? "")
        : field.type === "switch"
          ? answer.value
            ? "Yes"
            : "No"
          : String(answer.value);
    evaluated.push({ ...answer, result: outcome.result, displayValue });
  }
  for (const field of fields.values()) {
    if (field.required && !seen.has(field.id)) throw new Error(`${field.label}: an answer is required.`);
  }
  if (!evaluated.length) throw new Error("Answer at least one maintenance field.");
  return evaluated;
}

export function validateChecklist(sections: MaintenanceSection[]): string[] {
  const errors: string[] = [];
  const sectionIds = new Set<string>();
  const fieldIds = new Set<string>();
  for (const section of sections) {
    if (sectionIds.has(section.id)) errors.push("Section identifiers must be unique.");
    sectionIds.add(section.id);
    if (!section.label.trim()) errors.push("Every section needs a name.");
    for (const field of section.fields) {
      if (fieldIds.has(field.id)) errors.push("Field identifiers must be unique across the checklist.");
      fieldIds.add(field.id);
      if (!field.label.trim()) errors.push(`A field in ${section.label || "an unnamed section"} needs a label.`);
      if (field.type === "dropdown") {
        if (!field.options.length) errors.push(`${field.label}: add at least one option.`);
        if (new Set(field.options.map((option) => option.id)).size !== field.options.length)
          errors.push(`${field.label}: option identifiers must be unique.`);
        if (field.options.some((option) => !option.label.trim())) errors.push(`${field.label}: every option needs a label.`);
      }
    }
  }
  if (fieldIds.size > MAX_CHECKLIST_FIELDS) errors.push("A checklist can contain at most 300 fields.");
  if (!sections.some((section) => section.enabled && section.fields.some((field) => field.enabled)))
    errors.push("Enable at least one section with an enabled field before publishing.");
  if (serializedBytes(sections) > MAX_TEMPLATE_BYTES) errors.push("This checklist is too large. Reduce the number of fields or instructions.");
  return [...new Set(errors)];
}

export function serializedBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}
