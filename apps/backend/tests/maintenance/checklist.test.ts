import { describe, expect, test } from "bun:test";
import type { Id } from "../../convex/_generated/dataModel";
import {
  checklistContext,
  evaluateAnswers,
  explainRule,
  resolveChecklist,
  summarizeAnswers,
  validateChecklist,
} from "../../convex/core/maintenance/checklist";
import { starterChecklist } from "../../convex/core/maintenance/defaults";
import { allRoomsRule, type MaintenanceAnswer, type MaintenanceField, type MaintenanceSection } from "../../convex/core/maintenance/definitions";
import { maintenanceEntrySchema } from "../../convex/core/maintenance/schemas";

const room = { _id: "room-a" as Id<"classrooms">, attributes: ["mic", "projector"] as Id<"attributes">[] };
const otherRoom = "room-b" as Id<"classrooms">;
const mic = "mic" as Id<"attributes">;
const dten = "dten" as Id<"attributes">;

function fixtureAt<T>(values: readonly T[], index = 0): T {
  const value = values[index];
  if (value === undefined) throw new Error("Missing test fixture");
  return value;
}

function section(): MaintenanceSection {
  return structuredClone(fixtureAt(starterChecklist([])));
}

function answered(sections: MaintenanceSection[]): MaintenanceAnswer[] {
  return sections.flatMap((item) =>
    item.fields.map((field) => ({
      fieldId: field.id,
      value: field.type === "switch" ? true : field.type === "dropdown" ? fixtureAt(field.options).id : "Notes",
    }))
  );
}

describe("maintenance visibility", () => {
  test("all rooms match an unrestricted rule; selected without rooms matches none", () => {
    expect(explainRule(allRoomsRule(), room)).toBeNull();
    expect(explainRule({ ...allRoomsRule(), audience: "selected" }, room)).toContain("not in the selected rooms");
  });
  test("explicit exclusion wins over room inclusion", () => {
    expect(explainRule({ ...allRoomsRule(), audience: "selected", roomIds: [room._id], excludeRoomIds: [room._id] }, room)).toContain(
      "explicitly excluded"
    );
  });
  test("room and attribute conditions combine with AND", () => {
    const rule = { ...allRoomsRule(), audience: "selected" as const, roomIds: [otherRoom], allAttributeIds: [mic] };
    expect(explainRule(rule, room)).not.toBeNull();
    expect(explainRule({ ...rule, roomIds: [room._id] }, room)).toBeNull();
  });
  test("all, any, and none attributes have distinct semantics", () => {
    expect(explainRule({ ...allRoomsRule(), allAttributeIds: [mic, dten] }, room)).toContain("missing");
    expect(explainRule({ ...allRoomsRule(), anyAttributeIds: [mic, dten] }, room)).toBeNull();
    expect(explainRule({ ...allRoomsRule(), anyAttributeIds: [dten] }, room)).toContain("none of");
    expect(explainRule({ ...allRoomsRule(), noneAttributeIds: [dten] }, room)).toBeNull();
    expect(explainRule({ ...allRoomsRule(), noneAttributeIds: [mic] }, room)).toContain("excluded attribute");
  });
  test("field restrictions narrow the section without widening it", () => {
    const item = section();
    fixtureAt(item.fields).visibility = { mode: "restrict", rules: { ...allRoomsRule(), excludeRoomIds: [room._id] } };
    expect(resolveChecklist([item], room)[0]?.fields.map((field) => field.id)).toEqual([fixtureAt(item.fields, 1).id]);
    item.visibility = { ...allRoomsRule(), audience: "selected", roomIds: [otherRoom] };
    expect(resolveChecklist([item], room)).toEqual([]);
  });
  test("custom rules can show a field outside its section audience and retain the heading", () => {
    const item = section();
    item.visibility = { ...allRoomsRule(), audience: "selected", roomIds: [otherRoom] };
    fixtureAt(item.fields).visibility.mode = "custom";
    const resolved = resolveChecklist([item], room);
    expect(resolved[0]?.label).toBe(item.label);
    expect(resolved[0]?.fields.map((field) => field.id)).toEqual([fixtureAt(item.fields).id]);
  });
  test("disabled sections suppress even custom fields; disabled fields and empty sections disappear", () => {
    const item = section();
    item.enabled = false;
    fixtureAt(item.fields).visibility.mode = "custom";
    expect(resolveChecklist([item], room)).toEqual([]);
    item.enabled = true;
    for (const field of item.fields) field.enabled = false;
    expect(resolveChecklist([item], room)).toEqual([]);
  });
  test("resolution preserves ordering and never mutates the definition", () => {
    const items = starterChecklist([]);
    const before = structuredClone(items);
    const resolved = resolveChecklist(items, room);
    expect(items).toEqual(before);
    expect(resolved.map((item) => item.id)).toEqual(["general"]);
    expect(resolved[0]?.fields.map((field) => field.id)).toEqual(["surfaces-wiped", "equipment-checked"]);
  });
  test("equipment starter sections are targeted using attribute IDs and otherwise match no rooms", () => {
    const items = starterChecklist([{ _id: mic, label: "Microphone" }]);
    expect(resolveChecklist(items, room).map((item) => item.id)).toEqual(["general", "microphone"]);
  });
  test("room context changes with attributes, but not ordering or duplicate IDs", () => {
    expect(checklistContext(room)).toBe(checklistContext({ ...room, attributes: [...room.attributes].reverse().concat(mic) }));
    expect(checklistContext(room)).not.toBe(checklistContext({ ...room, attributes: [] }));
  });
});

describe("maintenance answers and outcomes", () => {
  test("required switches distinguish false from an unanswered field", () => {
    const items = [section()];
    const answers = answered(items);
    expect(() => evaluateAnswers(items, answers.slice(1))).toThrow("an answer is required");
    const first = fixtureAt(fixtureAt(items).fields) as Extract<MaintenanceField, { type: "switch" }>;
    first.falseOutcome = { result: "blocked", followUp: "none" };
    fixtureAt(answers).value = false;
    expect(evaluateAnswers(items, answers)[0]?.result).toBe("blocked");
  });
  test("rejects duplicate, hidden, unknown, and incorrectly typed answers", () => {
    const items = [section()];
    const answers = answered(items);
    expect(() => evaluateAnswers(items, [...answers, fixtureAt(answers)])).toThrow("more than once");
    expect(() => evaluateAnswers(items, [...answers, { fieldId: "hidden", value: true }])).toThrow("not applicable");
    expect(() => evaluateAnswers(items, [{ fieldId: fixtureAt(answers).fieldId, value: "yes" }])).toThrow("choose Yes or No");
    fixtureAt(fixtureAt(items).fields).enabled = false;
    expect(() => evaluateAnswers(resolveChecklist(items, room), answers)).toThrow("not applicable");
  });
  test("dropdown answers use option IDs and explicit mappings, independent of label wording", () => {
    const item = fixtureAt(starterChecklist([]), 1);
    const field = item.fields[0] as Extract<MaintenanceField, { type: "dropdown" }>;
    item.fields = [field];
    fixtureAt(field.options).label = "Anything, even No or Re-applied";
    const result = evaluateAnswers([item], [{ fieldId: field.id, value: fixtureAt(field.options).id }]);
    expect(result[0]).toMatchObject({ result: "pass", displayValue: fixtureAt(field.options).label });
    expect(() => evaluateAnswers([item], [{ fieldId: field.id, value: fixtureAt(field.options).label }])).toThrow("available option");
    expect(() => evaluateAnswers([item], [{ fieldId: field.id, value: true }])).toThrow("invalid answer type");
  });
  test("configured follow-up links are required and unrelated links are rejected", () => {
    const item = fixtureAt(starterChecklist([]), 1);
    const field = item.fields[0] as Extract<MaintenanceField, { type: "dropdown" }>;
    item.fields = [field];
    const answer = { fieldId: field.id, value: "follow-up" };
    expect(() => evaluateAnswers([item], [answer])).toThrow("link a task");
    expect(evaluateAnswers([item], [{ ...answer, taskId: "task" as Id<"tasks"> }])[0]?.result).toBe("follow_up");
    expect(() => evaluateAnswers([item], [{ fieldId: field.id, value: "blocked" }])).toThrow("link an issue");
    expect(evaluateAnswers([item], [{ fieldId: field.id, value: "blocked", issueId: "issue" as Id<"issues"> }])[0]?.result).toBe("blocked");
    expect(() => evaluateAnswers([item], [{ fieldId: field.id, value: "yes", taskId: "task" as Id<"tasks"> }])).toThrow("does not match");
  });
  test("text is informational, optional blanks are ignored, and required blanks fail", () => {
    const item = section();
    const field: MaintenanceField = { ...fixtureAt(item.fields), type: "text", required: false };
    item.fields = [field];
    expect(evaluateAnswers([item], [{ fieldId: field.id, value: "No, blocked, Re-applied" }])[0]?.result).toBe("info");
    expect(() => evaluateAnswers([item], [{ fieldId: field.id, value: "   " }])).toThrow("at least one");
    field.required = true;
    expect(() => evaluateAnswers([item], [{ fieldId: field.id, value: "   " }])).toThrow("an answer is required");
  });
  test.each([
    [[], "unscored"],
    [["info", "not_applicable"], "unscored"],
    [["pass", "info"], "clean_pass"],
    [["pass", "corrected"], "corrective_actions"],
    [["follow_up", "pass"], "corrective_actions"],
    [["blocked", "corrected", "follow_up"], "blocked"],
  ] as const)("aggregates %j as %s", (results, expected) => {
    expect(summarizeAnswers(results.map((result) => ({ result }))).status).toBe(expected);
  });
  test("counts corrections, outstanding work, and blocked checks independently", () => {
    expect(summarizeAnswers([{ result: "corrected" }, { result: "follow_up" }, { result: "blocked" }])).toMatchObject({
      corrected: 1,
      follow_up: 1,
      blocked: 1,
    });
  });
});

describe("checklist publication and compatibility", () => {
  test("starter definitions are publishable and missing labels/options are actionable", () => {
    expect(validateChecklist(starterChecklist([]))).toEqual([]);
    const item = fixtureAt(starterChecklist([]), 1);
    item.label = "";
    const field = item.fields[0] as Extract<MaintenanceField, { type: "dropdown" }>;
    field.label = "";
    field.options = [];
    expect(validateChecklist([item]).join(" ")).toContain("section needs a name");
    expect(validateChecklist([item]).join(" ")).toContain("at least one option");
  });
  test("duplicate field IDs across sections and option IDs within a field are rejected", () => {
    const item = fixtureAt(starterChecklist([]), 1);
    const copy = structuredClone(item);
    copy.id = "copy";
    expect(validateChecklist([item, copy]).join(" ")).toContain("Field identifiers must be unique");
    const field = item.fields[0] as Extract<MaintenanceField, { type: "dropdown" }>;
    field.options.push(fixtureAt(field.options));
    expect(validateChecklist([item]).join(" ")).toContain("option identifiers must be unique");
  });
  test("publishing an empty or completely disabled checklist fails", () => {
    expect(validateChecklist([]).join(" ")).toContain("Enable at least one");
    const item = section();
    item.enabled = false;
    expect(validateChecklist([item]).join(" ")).toContain("Enable at least one");
  });
  test("the additive storage schema accepts original maintenance records", () => {
    expect(
      maintenanceEntrySchema.safeParse({
        classroomId: room._id,
        date: "2026-11-04T18:00:00.000Z",
        completedBy: "user@example.com",
        surfacesWiped: true,
        equipmentChecked: false,
      }).success
    ).toBe(true);
  });
});
