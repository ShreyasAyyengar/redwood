import { api } from "@backend/convex/_generated/api";
import type { Doc, Id } from "@backend/convex/_generated/dataModel";
import { evaluateAnswers, getAnswerOutcome, summarizeAnswers } from "@backend/convex/core/maintenance/checklist";
import type { EvaluatedAnswer, MaintenanceAnswer, MaintenanceField } from "@backend/convex/core/maintenance/definitions";
import { Button } from "@redwood/shad-ui/components/button";
import { DialogClose, DialogFooter } from "@redwood/shad-ui/components/dialog";
import { Input } from "@redwood/shad-ui/components/input";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useState } from "react";
import { IssueDialog } from "#/features/issues/components/dialogs/issue-dialog.tsx";
import { TaskDialog } from "#/features/tasks/components/dialogs/task-dialog.tsx";
import { ChecklistNotice, ChecklistSelect, ChecklistSummary, maintenanceErrorMessage, resultLabels } from "../checklist-controls";
import { ChecklistFields } from "../checklist-fields";

type RoomChecklist = NonNullable<FunctionReturnType<typeof api.core.maintenance.service.getChecklist>>;

function localDateTime() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function ConfiguredMaintenanceForm({
  roomId,
  checklist: latest,
  onSuccess,
}: {
  roomId: Id<"classrooms">;
  checklist: RoomChecklist;
  onSuccess?: () => void;
}) {
  const [checklist, setChecklist] = useState(latest);
  const [answers, setAnswers] = useState<MaintenanceAnswer[]>([]);
  const [date, setDate] = useState(localDateTime);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [createTask, setCreateTask] = useState(false);
  const [createIssue, setCreateIssue] = useState(false);
  const submit = useMutation(api.core.maintenance.service.submitChecklist);
  const stale = checklist.versionId !== latest.versionId || checklist.context !== latest.context;
  const fields = checklist.sections.flatMap((section) => section.fields);
  const followUps = answers.map((answer) => {
    const field = fields.find((candidate) => candidate.id === answer.fieldId);
    return field ? getAnswerOutcome(field, answer.value).followUp : "none";
  });
  const tasks = useQuery(api.core.tasks.service.getClassroomTasks, followUps.includes("task") ? { classroomId: roomId } : "skip");
  const issues = useQuery(api.core.issues.service.getClassroomIssues, followUps.includes("issue") ? { classroomId: roomId } : "skip");
  const required = fields.filter((field) => field.required);
  const completed = required.filter((field) =>
    answers.some((answer) => answer.fieldId === field.id && (typeof answer.value === "boolean" || answer.value.trim().length > 0))
  ).length;
  let evaluated: EvaluatedAnswer[] | undefined;
  try {
    evaluated = evaluateAnswers(checklist.sections, answers);
  } catch {
    /* Incomplete answers are validated when submitted. */
  }

  function update(fieldId: string, answer: MaintenanceAnswer | undefined) {
    setAnswers((current) => [...current.filter((item) => item.fieldId !== fieldId), ...(answer ? [answer] : [])]);
    setError("");
  }
  function refresh() {
    const nextFields = latest.sections.flatMap((section) => section.fields);
    setAnswers((current) =>
      current
        .filter((answer) => {
          const field = nextFields.find((candidate) => candidate.id === answer.fieldId);
          if (!field) return false;
          try {
            getAnswerOutcome(field, answer.value);
            return true;
          } catch {
            return false;
          }
        })
        .map((answer) => ({ fieldId: answer.fieldId, value: answer.value }))
    );
    setChecklist(latest);
    setError("");
  }
  async function save() {
    setError("");
    if (stale) return;
    try {
      evaluateAnswers(checklist.sections, answers);
      const enteredDate = new Date(date);
      if (!date || !Number.isFinite(enteredDate.getTime())) throw new Error("Choose a valid maintenance date.");
      setPending(true);
      await submit({
        classroomId: roomId,
        date: enteredDate.toISOString(),
        versionId: checklist.versionId,
        context: checklist.context,
        answers,
      });
      onSuccess?.();
    } catch (failure) {
      setError(maintenanceErrorMessage(failure));
    } finally {
      setPending(false);
    }
  }
  function followUpPicker(field: MaintenanceField, answer: MaintenanceAnswer | undefined) {
    if (!answer) return null;
    const outcome = getAnswerOutcome(field, answer.value);
    if (outcome.followUp === "none") return null;
    const isTask = outcome.followUp === "task";
    const items = isTask
      ? tasks?.filter((task) => !task.completion).map((task) => ({ id: task._id, label: task.task.description }))
      : issues?.filter((issue) => !issue.resolution).map((issue) => ({ id: issue._id, label: issue.issue.description }));
    return (
      <div className="space-y-2 rounded-md border border-amber-500/30 p-3">
        <ChecklistSelect
          label={`Link ${isTask ? "a task" : "an issue"} for ${field.label}`}
          value={(isTask ? answer.taskId : answer.issueId) ?? ""}
          disabled={pending}
          onChange={(event) => {
            const { taskId: _task, issueId: _issue, ...rest } = answer;
            update(field.id, {
              ...rest,
              ...(event.target.value
                ? isTask
                  ? { taskId: event.target.value as Id<"tasks"> }
                  : { issueId: event.target.value as Id<"issues"> }
                : {}),
            });
          }}
        >
          <option value="">{items ? `Select an existing ${isTask ? "task" : "issue"}…` : "Loading…"}</option>
          {items?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </ChecklistSelect>
        <p className="text-xs text-zinc-400">
          Check existing work to avoid duplicates. After creating a new {isTask ? "task" : "issue"}, select it above.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => (isTask ? setCreateTask(true) : setCreateIssue(true))}
        >
          Create {isTask ? "task" : "issue"}
        </Button>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="bg-background/30 max-h-[calc(100dvh-280px)] rounded-xl p-3">
        <div className="space-y-5">
          {stale && (
            <ChecklistNotice>
              The checklist or room attributes changed. Refresh and review the updated questions before submitting.
              <Button type="button" variant="outline" className="mt-2" disabled={pending} onClick={refresh}>
                Refresh checklist
              </Button>
            </ChecklistNotice>
          )}
          <label className="block space-y-2 text-sm">
            <span>Date of maintenance</span>
            <Input type="datetime-local" value={date} disabled={pending} onChange={(event) => setDate(event.target.value)} />
          </label>
          <p className="text-xs text-zinc-400">
            Checklist v{checklist.versionNumber} · {completed}/{required.length} required checks answered. * Required
          </p>
          {fields.length === 0 ? (
            <ChecklistNotice>No maintenance fields apply to this classroom. Ask a supervisor to review the checklist rules.</ChecklistNotice>
          ) : (
            <ChecklistFields
              sections={checklist.sections}
              answers={answers}
              onChange={update}
              disabled={pending || stale}
              renderFollowUp={followUpPicker}
            />
          )}
          {evaluated && <ChecklistSummary summary={summarizeAnswers(evaluated)} />}
        </div>
      </ScrollArea>
      {error && <ChecklistNotice error>{error}</ChecklistNotice>}
      <DialogFooter className="mt-3">
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={pending}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="button" disabled={pending || stale || !fields.length} onClick={save}>
          {pending ? "Logging…" : "Log maintenance"}
        </Button>
      </DialogFooter>
      <TaskDialog roomId={roomId} open={createTask} onOpenChange={setCreateTask} />
      <IssueDialog roomId={roomId} open={createIssue} onOpenChange={setCreateIssue} />
    </>
  );
}

export function ChecklistRecord({ entry }: { entry: Doc<"maintenance"> }) {
  const snapshot = entry.checklist;
  const tasks = useQuery(
    api.core.tasks.service.getClassroomTasks,
    snapshot?.answers.some((answer) => answer.taskId) ? { classroomId: entry.classroomId } : "skip"
  );
  const issues = useQuery(
    api.core.issues.service.getClassroomIssues,
    snapshot?.answers.some((answer) => answer.issueId) ? { classroomId: entry.classroomId } : "skip"
  );
  if (!snapshot) return null;
  return (
    <>
      <ScrollArea className="bg-background/30 max-h-[calc(100dvh-280px)] rounded-xl p-3">
        <div className="space-y-5">
          <p className="text-sm text-zinc-400">
            {new Date(entry.date).toLocaleString()} · Checklist v{snapshot.versionNumber}
          </p>
          <ChecklistSummary summary={snapshot.summary} />
          {snapshot.sections.map((section) => (
            <section key={section.id} className="space-y-3">
              <h3 className="text-lg font-semibold">{section.label}</h3>
              {section.description && <p className="text-sm text-zinc-400">{section.description}</p>}
              <dl className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-950/30 p-3">
                {section.fields.map((field) => {
                  const answer = snapshot.answers.find((item) => item.fieldId === field.id);
                  const task = answer?.taskId ? tasks?.find((item) => item._id === answer.taskId) : undefined;
                  const issue = answer?.issueId ? issues?.find((item) => item._id === answer.issueId) : undefined;
                  return (
                    <div key={field.id} className="space-y-1">
                      <dt className="text-sm font-medium">{field.label}</dt>
                      {field.helpText && <dd className="text-xs whitespace-pre-line text-zinc-500">{field.helpText}</dd>}
                      <dd className="text-sm break-words whitespace-pre-wrap text-zinc-300">
                        {answer?.displayValue ?? "Not answered (optional)"}
                      </dd>
                      {answer && (
                        <dd className="text-xs text-zinc-400">
                          {resultLabels[answer.result]}
                          {answer.taskId ? " · Task linked" : ""}
                          {answer.issueId ? " · Issue linked" : ""}
                        </dd>
                      )}
                      {task && (
                        <dd>
                          <TaskDialog roomId={entry.classroomId} existingTask={task}>
                            <Button type="button" variant="outline" size="sm">
                              View linked task
                            </Button>
                          </TaskDialog>
                        </dd>
                      )}
                      {issue && (
                        <dd>
                          <IssueDialog roomId={entry.classroomId} existingIssue={issue}>
                            <Button type="button" variant="outline" size="sm">
                              View linked issue
                            </Button>
                          </IssueDialog>
                        </dd>
                      )}
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}
        </div>
      </ScrollArea>
      <DialogFooter className="mt-3">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Close
          </Button>
        </DialogClose>
      </DialogFooter>
    </>
  );
}
