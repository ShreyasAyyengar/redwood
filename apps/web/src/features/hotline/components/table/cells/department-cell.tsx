import { cn } from "@redwood/shad-ui/lib/utils";

export function DepartmentCell({ value }: { value: "EVENTS" | "INSTRUCTION" }) {
  const isEvents = value === "EVENTS";

  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs",
        isEvents ? "border-violet-500/20 bg-violet-500/10 text-violet-300" : "border-sky-500/20 bg-sky-500/10 text-sky-300"
      )}
    >
      <span
        className={cn(
          "size-2 shrink-0 rounded-full",
          isEvents ? "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.35)]" : "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.35)]"
        )}
      />
      {isEvents ? "Events" : "Instruction"}
    </span>
  );
}
