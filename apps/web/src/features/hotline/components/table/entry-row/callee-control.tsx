import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@redwood/shad-ui/components/select";
import { UserRound } from "lucide-react";

type CalleeControlProps = {
  invalid: boolean;
  isAdmin: boolean;
  onChange: (value: string) => void;
  users: Array<{ email: string }>;
  value: string;
};

export function CalleeControl({ invalid, isAdmin, onChange, users, value }: CalleeControlProps) {
  if (!isAdmin) {
    return (
      <div className="flex h-8 items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900/60 px-2 text-xs text-zinc-300">
        <UserRound className="size-3.5 text-zinc-500" />
        {value.split("@")[0]}
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label="Call taken by" aria-invalid={invalid} className="h-8 w-full border-zinc-700 bg-zinc-900/80 text-xs">
        <SelectValue>{value.split("@")[0]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {value && !users.some((user) => user.email === value) && <SelectItem value={value}>{value.split("@")[0]}</SelectItem>}
        {users.map((user) => (
          <SelectItem key={user.email} value={user.email}>
            {user.email.split("@")[0]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
