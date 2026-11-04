import { api } from "@backend/convex/_generated/api";
import { explainField, resolveChecklist, validateChecklist } from "@backend/convex/core/maintenance/checklist";
import { allRoomsRule, type MaintenanceAnswer, type MaintenanceSection } from "@backend/convex/core/maintenance/definitions";
import { Button } from "@redwood/shad-ui/components/button";
import { Input } from "@redwood/shad-ui/components/input";
import { Textarea } from "@redwood/shad-ui/components/textarea";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ChecklistNotice, ChecklistSelect, maintenanceErrorMessage } from "#/features/maintenance/components/checklist-controls.tsx";
import { ChecklistFields } from "#/features/maintenance/components/checklist-fields.tsx";
import { FieldEditor, newMaintenanceField } from "./field-editor";
import { type RuleAttribute, type RuleRoom, VisibilityEditor } from "./visibility-editor";

type EditorData = FunctionReturnType<typeof api.core.maintenance.service.getTemplateEditor>;

export function MaintenanceFieldsEditor() {
  const editor = useQuery(api.core.maintenance.service.getTemplateEditor, {});
  const rooms = useQuery(api.core.classrooms.service.getClassroomLookup, {});
  const attributes = useQuery(api.core.attributes.service.getAllAttributes, {});
  if (!editor || !rooms || !attributes) return <p className="p-6 text-zinc-400">Loading maintenance fields…</p>;
  return <MaintenanceEditorWorkspace editor={editor} rooms={rooms} attributes={attributes} />;
}

function MaintenanceEditorWorkspace({ editor, rooms, attributes }: { editor: EditorData; rooms: RuleRoom[]; attributes: RuleAttribute[] }) {
  const [sections, setSections] = useState<MaintenanceSection[]>(() => structuredClone(editor.sections));
  const [revision, setRevision] = useState(editor.revision);
  const [saved, setSaved] = useState(JSON.stringify(editor.sections));
  const [selectedId, setSelectedId] = useState(editor.sections[0]?.id);
  const [previewRoomId, setPreviewRoomId] = useState("");
  const [previewAnswers, setPreviewAnswers] = useState<MaintenanceAnswer[]>([]);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [deletedState, setDeletedState] = useState<MaintenanceSection[] | null>(null);
  const saveDraft = useMutation(api.core.maintenance.service.saveTemplateDraft);
  const publish = useMutation(api.core.maintenance.service.publishTemplate);
  const dirty = JSON.stringify(sections) !== saved;
  const conflict = editor.revision !== revision;
  const section = sections.find((candidate) => candidate.id === selectedId);
  const activeRooms = rooms.filter((room) => room.isActive);
  const previewRoom = activeRooms.find((room) => room._id === previewRoomId);
  const resolved = previewRoom ? resolveChecklist(sections, previewRoom) : [];
  const matchingRooms = activeRooms.filter((room) => resolveChecklist(sections, room).length > 0).length;

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  function change(next: MaintenanceSection[]) {
    setSections(next);
    setMessage("");
    setError("");
    setPreviewAnswers([]);
  }
  function updateSection(next: MaintenanceSection) {
    change(sections.map((item) => (item.id === next.id ? next : item)));
  }
  function reload() {
    setSections(structuredClone(editor.sections));
    setRevision(editor.revision);
    setSaved(JSON.stringify(editor.sections));
    setSelectedId(editor.sections[0]?.id);
    setError("");
    setMessage("Loaded the saved draft.");
    setPreviewAnswers([]);
  }
  async function save(shouldPublish: boolean) {
    setError("");
    setMessage("");
    if (shouldPublish) {
      const errors = validateChecklist(sections);
      if (errors.length) {
        setError(errors.join("\n"));
        return;
      }
    }
    setPending(true);
    try {
      let nextRevision = revision;
      if (dirty || revision === 0) {
        nextRevision = await saveDraft({ expectedRevision: revision, sections });
        setRevision(nextRevision);
        setSaved(JSON.stringify(sections));
      }
      if (shouldPublish) {
        const version = await publish({ expectedRevision: nextRevision });
        setMessage(`Version ${version} is published. New maintenance forms now use this checklist.`);
      } else setMessage("Draft saved. The published checklist is unchanged.");
    } catch (failure) {
      setError(maintenanceErrorMessage(failure));
    } finally {
      setPending(false);
    }
  }
  function moveSection(index: number, direction: number) {
    const next = [...sections];
    next.splice(index + direction, 0, ...next.splice(index, 1));
    change(next);
  }

  return (
    <div className="h-[calc(100dvh-145px)] w-full max-w-[1280px] min-w-0 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 text-zinc-200">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Maintenance Fields</h2>
          <p className="mt-1 text-sm text-zinc-400">Build one checklist that adapts to every classroom.</p>
          <p className="mt-2 text-xs text-zinc-500">
            {editor.versionNumber
              ? `Published version ${editor.versionNumber}`
              : "No published checklist · staff currently use the original form"}{" "}
            · {dirty ? "Unsaved changes" : editor.publishedRevision === revision ? "All changes published" : "Draft"} · {matchingRooms} of{" "}
            {activeRooms.length} active rooms matched
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" disabled={pending} onClick={reload}>
            Reload saved draft
          </Button>
          <Button type="button" variant="outline" disabled={pending || conflict || (!dirty && revision > 0)} onClick={() => save(false)}>
            Save draft
          </Button>
          <Button
            type="button"
            disabled={pending || conflict || (!dirty && revision > 0 && editor.publishedRevision === revision)}
            onClick={() => save(true)}
          >
            {pending ? "Saving…" : "Publish checklist"}
          </Button>
        </div>
      </div>
      <div className="mb-4 space-y-3">
        {conflict && !pending && (
          <ChecklistNotice error>
            Another administrator changed the saved draft. Reload it before saving or publishing. Your local changes are still visible.
          </ChecklistNotice>
        )}
        {message && <ChecklistNotice>{message}</ChecklistNotice>}
        {error && <ChecklistNotice error>{error}</ChecklistNotice>}
        {deletedState && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            Removed from this draft.
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => {
                change(deletedState);
                setDeletedState(null);
              }}
            >
              Undo removal
            </Button>
          </div>
        )}
      </div>
      <fieldset disabled={pending} className="min-w-0 space-y-5 disabled:opacity-60">
        <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="space-y-2">
            <p className="mb-3 text-sm font-medium text-zinc-400">Sections ({sections.length}/30)</p>
            {sections.map((item, index) => (
              <div
                key={item.id}
                className={`rounded-lg border p-2 ${item.id === selectedId ? "border-indigo-400/50 bg-indigo-500/10" : "border-zinc-800"}`}
              >
                <button type="button" className="w-full text-left text-sm break-words" onClick={() => setSelectedId(item.id)}>
                  {item.label || "Untitled section"}
                </button>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    {item.fields.length} fields{item.enabled ? "" : " · disabled"}
                  </span>
                  <div className="flex">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label={`Move ${item.label} up`}
                      disabled={index === 0}
                      onClick={() => moveSection(index, -1)}
                    >
                      <ArrowUp className="size-3" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label={`Move ${item.label} down`}
                      disabled={index === sections.length - 1}
                      onClick={() => moveSection(index, 1)}
                    >
                      <ArrowDown className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={sections.length >= 30}
              onClick={() => {
                const added: MaintenanceSection = {
                  id: crypto.randomUUID(),
                  label: "New section",
                  description: "",
                  enabled: true,
                  visibility: allRoomsRule(),
                  fields: [],
                };
                change([...sections, added]);
                setSelectedId(added.id);
              }}
            >
              <Plus className="size-4" />
              Add section
            </Button>
          </aside>
          {section ? (
            <div className="min-w-0 space-y-5 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={(event) => updateSection({ ...section, enabled: event.target.checked })}
                  />
                  Section enabled
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDeletedState(sections);
                    change(sections.filter((item) => item.id !== section.id));
                    setSelectedId(sections.find((item) => item.id !== section.id)?.id);
                  }}
                >
                  <Trash2 className="size-3" />
                  Remove section
                </Button>
              </div>
              <label className="block space-y-1.5 text-sm">
                <span>Section name</span>
                <Input maxLength={160} value={section.label} onChange={(event) => updateSection({ ...section, label: event.target.value })} />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span>Description (optional)</span>
                <Textarea
                  maxLength={2000}
                  value={section.description}
                  onChange={(event) => updateSection({ ...section, description: event.target.value })}
                />
              </label>
              <details className="rounded-lg border border-zinc-700 p-3" open>
                <summary className="cursor-pointer text-sm font-medium">Section visibility</summary>
                <div className="mt-3">
                  <VisibilityEditor
                    rule={section.visibility}
                    onChange={(visibility) => updateSection({ ...section, visibility })}
                    rooms={rooms}
                    attributes={attributes}
                  />
                </div>
              </details>
              <div className="space-y-3">
                <h3 className="font-medium">Fields ({section.fields.length}/50)</h3>
                {section.fields.map((field, index) => (
                  <details key={field.id} className="rounded-lg border border-zinc-700 bg-zinc-950/30 p-3">
                    <summary className="cursor-pointer text-sm font-medium break-words">
                      {field.label || "Untitled field"}{" "}
                      <span className="font-normal text-zinc-500">
                        · {field.type}
                        {field.enabled ? "" : " · disabled"}
                        {field.visibility.mode === "inherit" ? "" : ` · ${field.visibility.mode} visibility`}
                      </span>
                    </summary>
                    <div className="mt-4 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={index === 0}
                          onClick={() => {
                            const fields = [...section.fields];
                            fields.splice(index - 1, 0, ...fields.splice(index, 1));
                            updateSection({ ...section, fields });
                          }}
                        >
                          Move up
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={index === section.fields.length - 1}
                          onClick={() => {
                            const fields = [...section.fields];
                            fields.splice(index + 1, 0, ...fields.splice(index, 1));
                            updateSection({ ...section, fields });
                          }}
                        >
                          Move down
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setDeletedState(sections);
                            updateSection({ ...section, fields: section.fields.filter((item) => item.id !== field.id) });
                          }}
                        >
                          Remove field
                        </Button>
                      </div>
                      <FieldEditor
                        field={field}
                        onChange={(next) =>
                          updateSection({ ...section, fields: section.fields.map((item) => (item.id === next.id ? next : item)) })
                        }
                        rooms={rooms}
                        attributes={attributes}
                      />
                    </div>
                  </details>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  disabled={section.fields.length >= 50}
                  onClick={() => updateSection({ ...section, fields: [...section.fields, newMaintenanceField()] })}
                >
                  <Plus className="size-4" />
                  Add field
                </Button>
              </div>
            </div>
          ) : (
            <p className="p-6 text-zinc-400">Add or select a section to edit its fields.</p>
          )}
        </div>
        <section className="space-y-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
          <div>
            <h3 className="text-lg font-semibold">Preview as classroom</h3>
            <p className="text-sm text-zinc-400">Preview this draft before publishing. Answers here are not saved.</p>
          </div>
          <ChecklistSelect
            label="Classroom"
            value={previewRoomId}
            onChange={(event) => {
              setPreviewRoomId(event.target.value);
              setPreviewAnswers([]);
            }}
          >
            <option value="">Choose a classroom…</option>
            {activeRooms.map((room) => (
              <option key={room._id} value={room._id}>
                {room.displayName}
              </option>
            ))}
          </ChecklistSelect>
          {previewRoom && (
            <>
              <p className="text-sm text-zinc-400">
                {resolved.reduce((count, item) => count + item.fields.length, 0)} visible fields in {resolved.length} sections.
              </p>
              {resolved.length ? (
                <ChecklistFields
                  sections={resolved}
                  answers={previewAnswers}
                  onChange={(fieldId, answer) =>
                    setPreviewAnswers((current) => [...current.filter((item) => item.fieldId !== fieldId), ...(answer ? [answer] : [])])
                  }
                />
              ) : (
                <ChecklistNotice>No fields apply to this classroom.</ChecklistNotice>
              )}
              <details className="rounded-lg border border-zinc-700 p-3">
                <summary className="cursor-pointer text-sm">Explain visibility for every field</summary>
                <ul className="mt-3 space-y-2 text-sm">
                  {sections.flatMap((item) =>
                    item.fields.map((field) => {
                      const reason = explainField(item, field, previewRoom);
                      return (
                        <li key={field.id} className={reason ? "text-zinc-500" : "text-emerald-300"}>
                          {item.label} / {field.label}:{" "}
                          {reason
                            ? `Hidden — ${reason}`
                            : `Visible — ${field.visibility.mode === "custom" ? "custom field rules match" : field.visibility.mode === "restrict" ? "section and field rules match" : "section rules match"}.`}
                        </li>
                      );
                    })
                  )}
                </ul>
              </details>
            </>
          )}
        </section>
      </fieldset>
    </div>
  );
}
