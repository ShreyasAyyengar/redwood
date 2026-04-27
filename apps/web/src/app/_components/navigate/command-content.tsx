import { CommandEmpty, CommandGroup, CommandItem, CommandList, CommandSeparator } from "@redwood/shad-ui/components/command";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, School, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { webClientORPC } from "../../../lib/orpc-web-client";
import { useFetchedRoomsStore } from "../room-store";

export default function CommandContent({ closeNavigator }: { closeNavigator: () => void }) {
  const { fetchedRooms } = useFetchedRoomsStore();

  const router = useRouter();
  const navigateToClassroom = (roomId: string) => {
    closeNavigator();
    router.push(`/classroom/${roomId}`);
  };

  const { data: issues, isFetching: issuesFetching } = useQuery(
    webClientORPC.issues.getAllIssues.queryOptions({
      input: { openOnly: true },
    })
  );
  const { data: tasks, isFetching: tasksFetching } = useQuery(
    webClientORPC.tasks.getAllTasks.queryOptions({
      input: { openOnly: true },
    })
  );

  return (
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>

      <CommandGroup heading="Classrooms">
        {fetchedRooms.map((room) => (
          <CommandItem key={room._id} value={room.displayName} onSelect={() => navigateToClassroom(room._id)}>
            <School className="size-5" />
            <span>{room.displayName}</span>
          </CommandItem>
        ))}
      </CommandGroup>

      <CommandSeparator />

      <CommandGroup heading="Active Issues">
        {issuesFetching && <div className="p-4 text-center text-muted-foreground text-sm">Finding active issues...</div>}
        {issues?.map((issue) => (
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
