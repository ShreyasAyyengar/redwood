import { describe, expect, test } from "bun:test";
import type { FunctionArgs } from "convex/server";
import type { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { MutationCtx } from "../../convex/_generated/server";
import { deleteAttribute } from "../../convex/core/attributes/service";
import { starterChecklist } from "../../convex/core/maintenance/defaults";
import {
  addMaintenanceEntry,
  getChecklist,
  getTemplateEditor,
  publishTemplate,
  saveTemplateDraft,
  submitChecklist,
} from "../../convex/core/maintenance/service";

function handler<Args, Result = unknown>(registered: unknown) {
  return (registered as { _handler: (ctx: MutationCtx, args: Args) => Promise<Result> })._handler;
}
const save = handler<FunctionArgs<typeof api.core.maintenance.service.saveTemplateDraft>, number>(saveTemplateDraft);
const publish = handler<FunctionArgs<typeof api.core.maintenance.service.publishTemplate>, number>(publishTemplate);
const checklist = handler<
  FunctionArgs<typeof api.core.maintenance.service.getChecklist>,
  {
    versionId: Id<"maintenanceTemplateVersions">;
    context: string;
    sections: Doc<"maintenanceTemplateVersions">["sections"];
  } | null
>(getChecklist);
const submit = handler<FunctionArgs<typeof api.core.maintenance.service.submitChecklist>>(submitChecklist);
const editor = handler<Record<string, never>>(getTemplateEditor);
const legacySubmit = handler<FunctionArgs<typeof api.core.maintenance.service.addMaintenanceEntry>>(addMaintenanceEntry);
const removeAttribute = handler<FunctionArgs<typeof api.core.attributes.service.deleteAttribute>>(deleteAttribute);
const classroomId = "room-a" as Id<"classrooms">;
const date = "2026-11-04T18:00:00.000Z";

// Exercise the registered validation/auth wrappers and mutation handlers without a deployment.
function database(role = "supervisor") {
  const tables = new Map<string, Record<string, unknown>[]>([
    [
      "classrooms",
      [{ _id: classroomId, _creationTime: 0, displayName: "A101", sourceRoomName: "A101", groupKey: "A", attributes: [], isActive: true }],
    ],
  ]);
  function rows(table: string) {
    if (!tables.has(table)) tables.set(table, []);
    return tables.get(table) as Record<string, unknown>[];
  }
  const ctx = {
    auth: { getUserIdentity: async () => ({ subject: "user", sessionId: "session" }) },
    runQuery: async (_reference: unknown, args: { model: string }) =>
      args.model === "session" ? { _id: "session" } : { role, email: "staff@example.com" },
    db: {
      query: (table: string) => ({
        withIndex: () => ({ unique: async () => structuredClone(rows(table)[0] ?? null) }),
        collect: async () => structuredClone(rows(table)),
      }),
      get: async (table: string, id: string) => structuredClone(rows(table).find((row) => row._id === id) ?? null),
      insert: async (table: string, value: Record<string, unknown>) => {
        const id = `${table}-${rows(table).length + 1}`;
        rows(table).push(structuredClone({ ...value, _id: id, _creationTime: Date.now() }));
        return id;
      },
      patch: async (table: string, id: string, value: Record<string, unknown>) => {
        const row = rows(table).find((item) => item._id === id);
        if (!row) throw new Error("Missing document");
        Object.assign(row, structuredClone(value));
      },
      delete: async (table: string, id: string) =>
        tables.set(
          table,
          rows(table).filter((row) => row._id !== id)
        ),
    },
  } as unknown as MutationCtx;
  return { ctx, rows };
}

async function published(role = "supervisor") {
  const db = database(role);
  await save(db.ctx, { expectedRevision: 0, sections: starterChecklist([]) });
  await publish(db.ctx, { expectedRevision: 1 });
  const resolved = await checklist(db.ctx, { classroomId });
  if (!resolved) throw new Error("Expected a published checklist");
  const args = {
    classroomId,
    date,
    versionId: resolved.versionId,
    context: resolved.context,
    answers: resolved.sections.flatMap((section) => section.fields.map((field) => ({ fieldId: field.id, value: true }))),
  };
  return { ...db, resolved, args };
}

describe("maintenance configuration lifecycle", () => {
  test("employees cannot read, save, or publish configuration", async () => {
    const { ctx, rows } = database("employee");
    await expect(editor(ctx, {})).rejects.toThrow("Supervisor access required");
    await expect(save(ctx, { expectedRevision: 0, sections: starterChecklist([]) })).rejects.toThrow("Supervisor access required");
    await expect(publish(ctx, { expectedRevision: 0 })).rejects.toThrow("Supervisor access required");
    expect(rows("maintenanceTemplates")).toHaveLength(0);
  });
  test("unpublished drafts do not replace the original maintenance form", async () => {
    const { ctx } = database();
    await save(ctx, { expectedRevision: 0, sections: starterChecklist([]) });
    expect(await checklist(ctx, { classroomId })).toBeNull();
    await legacySubmit(ctx, { classroomId, date, surfacesWiped: true, equipmentChecked: true });
  });
  test("saving and publishing reject stale revisions without overwriting another admin", async () => {
    const { ctx, rows } = database();
    await save(ctx, { expectedRevision: 0, sections: starterChecklist([]) });
    await expect(save(ctx, { expectedRevision: 0, sections: [] })).rejects.toThrow("Another administrator");
    await expect(publish(ctx, { expectedRevision: 0 })).rejects.toThrow("draft changed");
    expect(rows("maintenanceTemplates")[0]?.revision).toBe(1);
    expect(rows("maintenanceTemplateVersions")).toHaveLength(0);
  });
  test("publishing creates immutable versions and repeated publication is idempotent", async () => {
    const { ctx, rows } = await published();
    const first = structuredClone(rows("maintenanceTemplateVersions"));
    expect(await publish(ctx, { expectedRevision: 1 })).toBe(1);
    expect(rows("maintenanceTemplateVersions")).toEqual(first);
    const sections = starterChecklist([]);
    const [general] = sections;
    if (!general) throw new Error("Missing fixture");
    general.label = "Renamed general checks";
    await save(ctx, { expectedRevision: 1, sections });
    expect((await checklist(ctx, { classroomId }))?.sections[0]?.label).toBe("General Maintenance");
    expect(await publish(ctx, { expectedRevision: 2 })).toBe(2);
    expect(rows("maintenanceTemplateVersions")[0]).toEqual(first[0]);
    expect((await checklist(ctx, { classroomId }))?.sections[0]?.label).toBe("Renamed general checks");
  });
  test("invalid definitions and references cannot be published", async () => {
    const { ctx, rows } = database();
    await save(ctx, { expectedRevision: 0, sections: [] });
    await expect(publish(ctx, { expectedRevision: 1 })).rejects.toThrow("Enable at least one");
    const sections = starterChecklist([]);
    const [general] = sections;
    if (!general) throw new Error("Missing fixture");
    general.visibility.noneAttributeIds = ["deleted" as Id<"attributes">];
    await save(ctx, { expectedRevision: 1, sections });
    await expect(publish(ctx, { expectedRevision: 2 })).rejects.toThrow("deleted room attribute");
    expect(rows("maintenanceTemplateVersions")).toHaveLength(0);
  });
  test("attributes referenced by draft or published visibility cannot be deleted", async () => {
    const { ctx, rows } = database();
    const id = "mic" as Id<"attributes">;
    rows("attributes").push({ _id: id, label: "Microphone", color: "blue" });
    await save(ctx, { expectedRevision: 0, sections: starterChecklist([{ _id: id, label: "Microphone" }]) });
    await expect(removeAttribute(ctx, { _id: id })).rejects.toThrow("maintenance visibility rule");
    await publish(ctx, { expectedRevision: 1 });
    await save(ctx, { expectedRevision: 1, sections: starterChecklist([]) });
    await expect(removeAttribute(ctx, { _id: id })).rejects.toThrow("maintenance visibility rule");
    await publish(ctx, { expectedRevision: 2 });
    await removeAttribute(ctx, { _id: id });
    expect(rows("attributes")).toHaveLength(0);
  });
});

describe("maintenance submission", () => {
  test("unauthenticated callers cannot load or submit a checklist", async () => {
    const { ctx, rows, args } = await published();
    ctx.auth.getUserIdentity = async () => null;
    await expect(checklist(ctx, { classroomId })).rejects.toThrow("Authentication required");
    await expect(submit(ctx, args)).rejects.toThrow("Authentication required");
    expect(rows("maintenance")).toHaveLength(0);
  });
  test("records the authenticated author, snapshot, answers, summary, and latest maintenance", async () => {
    const { ctx, rows, args } = await published();
    await submit(ctx, args);
    expect(rows("maintenance")[0]).toMatchObject({
      completedBy: "staff@example.com",
      classroomId,
      date,
      checklist: { versionNumber: 1, summary: { status: "clean_pass", pass: 2 } },
    });
    expect(rows("classrooms")[0]?.lastMaintenance).toEqual({ date, by: "staff@example.com" });
    const savedRecord = structuredClone(rows("maintenance")[0]);
    await save(ctx, { expectedRevision: 1, sections: starterChecklist([]).slice(1) });
    await publish(ctx, { expectedRevision: 2 });
    expect(rows("maintenance")[0]).toEqual(savedRecord);
  });
  test("rejects stale published versions and room attributes before writing", async () => {
    const { ctx, rows, args } = await published();
    const [classroom] = rows("classrooms");
    if (!classroom) throw new Error("Missing fixture");
    classroom.attributes = ["new-attribute"];
    await expect(submit(ctx, args)).rejects.toThrow("room attributes changed");
    classroom.attributes = [];
    await save(ctx, { expectedRevision: 1, sections: starterChecklist([]) });
    await publish(ctx, { expectedRevision: 2 });
    await expect(submit(ctx, args)).rejects.toThrow("checklist or room attributes changed");
    expect(rows("maintenance")).toHaveLength(0);
    expect(classroom.lastMaintenance).toBeUndefined();
  });
  test("rejects inactive rooms, incomplete answers, and injected hidden fields", async () => {
    const { ctx, rows, args } = await published();
    await expect(submit(ctx, { ...args, answers: [] })).rejects.toThrow("an answer is required");
    await expect(submit(ctx, { ...args, answers: [...args.answers, { fieldId: "dten.licenced", value: "yes" }] })).rejects.toThrow(
      "not applicable"
    );
    const [classroom] = rows("classrooms");
    if (!classroom) throw new Error("Missing fixture");
    classroom.isActive = false;
    await expect(submit(ctx, args)).rejects.toThrow("unavailable");
    expect(rows("maintenance")).toHaveLength(0);
  });
  test("follow-up IDs must exist and belong to the inspected classroom", async () => {
    const { ctx, rows, args } = await published();
    const taskId = "task" as Id<"tasks">;
    const answers = args.answers.map((answer, index) => (index === 0 ? { ...answer, value: false, taskId } : answer));
    await expect(submit(ctx, { ...args, answers })).rejects.toThrow("linked task does not belong");
    rows("tasks").push({ _id: taskId, classroomId: "other-room" });
    await expect(submit(ctx, { ...args, answers })).rejects.toThrow("linked task does not belong");
    const [linkedTask] = rows("tasks");
    if (!linkedTask) throw new Error("Missing fixture");
    linkedTask.classroomId = classroomId;
    await submit(ctx, { ...args, answers });
    expect(rows("maintenance")[0]).toMatchObject({ checklist: { summary: { status: "corrective_actions", follow_up: 1 } } });
  });
  test("historical submissions do not move the room's latest-maintenance timestamp backward", async () => {
    const { ctx, rows, args } = await published();
    await submit(ctx, args);
    await submit(ctx, { ...args, date: "2026-01-01T00:00:00.000Z" });
    expect(rows("classrooms")[0]?.lastMaintenance).toEqual({ date, by: "staff@example.com" });
  });
  test("the legacy mutation cannot bypass a published checklist", async () => {
    const { ctx, rows } = await published();
    await expect(legacySubmit(ctx, { classroomId, date, surfacesWiped: true, equipmentChecked: true })).rejects.toThrow("checklist has changed");
    expect(rows("maintenance")).toHaveLength(0);
  });
  test("oversized UTF-8 answers fail before writing a maintenance record", async () => {
    const { ctx, rows } = database();
    const [general] = starterChecklist([]);
    const firstField = general?.fields[0];
    if (!general || !firstField) throw new Error("Missing fixture");
    const sections = Array.from({ length: 5 }, (_, sectionIndex) => ({
      ...general,
      id: `section-${sectionIndex}`,
      fields: Array.from({ length: 50 }, (_fieldValue, fieldIndex) => ({
        ...firstField,
        id: `field-${sectionIndex}-${fieldIndex}`,
        type: "text" as const,
      })),
    }));
    await save(ctx, { expectedRevision: 0, sections });
    await publish(ctx, { expectedRevision: 1 });
    const resolved = await checklist(ctx, { classroomId });
    if (!resolved) throw new Error("Missing published checklist");
    await expect(
      submit(ctx, {
        classroomId,
        date,
        versionId: resolved.versionId,
        context: resolved.context,
        answers: sections.flatMap((section) => section.fields.map((field) => ({ fieldId: field.id, value: "界".repeat(4000) }))),
      })
    ).rejects.toThrow("record is too large");
    expect(rows("maintenance")).toHaveLength(0);
  });
});
