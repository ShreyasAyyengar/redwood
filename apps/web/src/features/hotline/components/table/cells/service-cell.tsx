import { cn } from "@redwood/shad-ui/lib/utils";
import { Phone, Wrench } from "lucide-react";

export function ServiceCell({ value }: { value: "ON-SITE" | "PHONE" }) {
  const isPhone = value === "PHONE";

  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs",
        isPhone ? "border-amber-500/20 bg-amber-500/10 text-amber-300" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      )}
    >
      {isPhone ? <Phone className="size-3.5" /> : <Wrench className="size-3.5" />}
      {isPhone ? "Phone" : "On-site"}
    </span>
  );
}
