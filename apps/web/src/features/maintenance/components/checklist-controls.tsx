import type { MaintenanceSummary } from "@backend/convex/core/maintenance/definitions";
import { type ReactNode, type SelectHTMLAttributes, useId } from "react";

export const resultLabels = {
  pass: "Pass",
  corrected: "Corrected during maintenance",
  follow_up: "Needs follow-up",
  blocked: "Blocked",
  info: "Informational",
  not_applicable: "Not applicable",
};

export function ChecklistSelect({ label, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  return (
    <div className="flex min-w-0 flex-col gap-1.5 text-sm">
      <label htmlFor={id} className="text-zinc-300">
        {label}
      </label>
      <select
        {...props}
        id={id}
        className="min-h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
      >
        {children}
      </select>
    </div>
  );
}

export function ChecklistNotice({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return (
    <div
      role={error ? "alert" : "status"}
      className={`rounded-lg border p-3 text-sm whitespace-pre-line ${error ? "border-red-500/40 bg-red-500/10 text-red-200" : "border-indigo-400/30 bg-indigo-500/10 text-indigo-100"}`}
    >
      {children}
    </div>
  );
}

export function maintenanceErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "data" in error) {
    const { data } = error;
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string") return data.message;
  }
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function ChecklistSummary({ summary }: { summary: MaintenanceSummary }) {
  const label = {
    clean_pass: "Clean pass",
    corrective_actions: "Corrective actions",
    blocked: "Blocked",
    unscored: "Recorded · no scored checks",
  }[summary.status];
  const tone = {
    clean_pass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    corrective_actions: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    blocked: "border-red-500/30 bg-red-500/10 text-red-200",
    unscored: "border-zinc-600 bg-zinc-800 text-zinc-300",
  }[summary.status];
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className={`rounded-md border px-2 py-1 font-medium ${tone}`}>{label}</span>
      {summary.corrected > 0 && <span className="text-sky-300">{summary.corrected} corrected</span>}
      {summary.follow_up > 0 && <span className="text-amber-300">{summary.follow_up} follow-up</span>}
      {summary.blocked > 0 && <span className="text-red-300">{summary.blocked} blocked</span>}
    </div>
  );
}
