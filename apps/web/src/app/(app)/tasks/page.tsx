import { TasksFeed } from "#/features/tasks/components/feed/tasks-feed.tsx";

export default function TasksPage() {
  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden p-5">
      <TasksFeed />
    </div>
  );
}
