import { api } from "@backend/convex/_generated/api";
import { CommandEmpty, CommandGroup, CommandItem, CommandList, CommandSeparator } from "@redwood/shad-ui/components/command";
import { usePaginatedQuery, useQuery } from "convex/react";
import { ClipboardList, School, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CommandContent({ closeNavigator }: { closeNavigator: () => void }) {
  const rooms = useQuery(api.core.classrooms.service.getAllRooms, {}) ?? [];

  const router = useRouter();
  const navigateToClassroom = (roomId: string) => {
    closeNavigator();
    router.push(`/classroom/${roomId}`);
  };

  const { results: issues, status: issuesStatus } = usePaginatedQuery(
    api.core.issues.service.getIssues,
    { view: "ACTIVE" },
    { initialNumItems: 50 }
  );
  const issuesFetching = issuesStatus === "LoadingFirstPage" || issuesStatus === "LoadingMore";
  const { results: tasks, status: tasksStatus } = usePaginatedQuery(api.core.tasks.service.getTasks, { view: "OPEN" }, { initialNumItems: 50 });
  const tasksFetching = tasksStatus === "LoadingFirstPage" || tasksStatus === "LoadingMore";

  return (
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>

      <CommandGroup heading="Classrooms">
        {rooms.map((room) => (
          <CommandItem key={room._id} value={room.displayName} onSelect={() => navigateToClassroom(room._id)}>
            <School className="size-5" />
            <span>{room.displayName}</span>
          </CommandItem>
        ))}
      </CommandGroup>

      <CommandSeparator />

      <CommandGroup heading="Active Issues">
        {issuesFetching && <div className="p-4 text-center text-muted-foreground text-sm">Finding active issues...</div>}
        {issues.map((issue) => (
          <CommandItem key={issue._id} value={issue.issue.description + issue._id} onSelect={() => navigateToClassroom(issue.classroomId)}>
            <TriangleAlert className="mr-2 size-5" />
            <span>{issue.issue.description}</span>
          </CommandItem>
        ))}
      </CommandGroup>

      <CommandSeparator />

      <CommandGroup heading="Open Tasks">
        {tasksFetching && <div className="p-4 text-center text-muted-foreground text-sm">Finding open tasks...</div>}
        {tasks?.map((task) => (
          <CommandItem key={task._id} value={task.task.description + task._id} onSelect={() => navigateToClassroom(task.classroomId)}>
            <ClipboardList className="mr-2 size-5" />
            <span>{task.task.description}</span>
          </CommandItem>
        ))}
      </CommandGroup>
    </CommandList>
  );
}
