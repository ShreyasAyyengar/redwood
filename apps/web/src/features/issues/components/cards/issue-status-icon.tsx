import { toolbox2 } from "@lucide/lab";
import { Check, Drill, Icon, TriangleAlert } from "lucide-react";
import type { ComponentProps } from "react";
import type { Issue } from "../../model/issue-state";

export function IssueStatusIcon({ issue, ...props }: { issue: Issue } & ComponentProps<typeof TriangleAlert>) {
  if (issue.resolution) return <Check {...props} className={`text-emerald-400 ${props.className ?? ""}`} />;
  if (issue.issue.sodId) return <Icon {...props} iconNode={toolbox2} className={`text-amber-400 ${props.className ?? ""}`} />;
  if (issue.issue.cruzfixId) return <Drill {...props} className={`text-amber-400 ${props.className ?? ""}`} />;
  if (issue.issue.urgent) return <TriangleAlert {...props} className={`text-red-400 ${props.className ?? ""}`} />;
  return <TriangleAlert {...props} className={`text-amber-400 ${props.className ?? ""}`} />;
}
