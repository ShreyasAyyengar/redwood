import type { departments } from "@backend/convex/core/hotline/log/schemas.ts";

type Department = (typeof departments.options)[number];

function formatDepartment(department: Department) {
  return department
    .toLocaleLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1))
    .join(" ");
}

export function DepartmentCell({ value }: { value: Department }) {
  return <span className="rounded-md border border-zinc-600/50 bg-zinc-700/30 px-2 py-1 text-xs text-zinc-300">{formatDepartment(value)}</span>;
}
