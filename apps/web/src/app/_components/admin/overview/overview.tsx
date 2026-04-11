import { Separator } from "@redwood/shad-ui/components/separator";
import IssueOverview from "./issue-overview";
import TaskOverview from "./task-overview";

export default function Overview() {
  return (
    <div className="rounded-lg bg-neutral-900 p-3">
      <div className="flex flex-col items-center">
        <span className="font-bold text-lg">Maintenance Overview </span>
        <span className="text-neutral-300 text-sm">Monitor issues an tasks at a glance</span>
        {/*<span className="text-neutral-300 text-sm">Monitor issues, tasks, and DTENs at a glance</span> TODO enable when integrated*/}
      </div>
      <Separator className="my-5" />
      <IssueOverview />
      <Separator className="my-8" />
      <TaskOverview />
    </div>
  );
}
