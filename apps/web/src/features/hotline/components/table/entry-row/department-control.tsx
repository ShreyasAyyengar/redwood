import { departments } from "@backend/convex/core/hotline/log/schemas.ts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@redwood/shad-ui/components/select";

type Department = (typeof departments.options)[number];

function formatDepartment(department: Department) {
  return department
    .toLocaleLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1))
    .join(" ");
}

type DepartmentControlProps = {
  onChange: (value: Department) => void;
  value: Department;
};

export function DepartmentControl({ onChange, value }: DepartmentControlProps) {
  return (
    <Select value={value} onValueChange={(nextValue) => onChange(departments.parse(nextValue))}>
      <SelectTrigger aria-label="Department" className="w-full border-zinc-700 bg-zinc-900/80 px-2 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {departments.options.map((department) => (
          <SelectItem key={department} value={department}>
            {formatDepartment(department)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
