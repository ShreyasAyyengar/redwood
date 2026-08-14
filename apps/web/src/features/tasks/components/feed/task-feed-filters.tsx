import { FeedFilterControls } from "#/features/feed/components/feed-filter-controls.tsx";
import type { TaskFeedFilterValue } from "../../model/task-filters";

export function TaskFeedFilters({ value, onChange }: { value: TaskFeedFilterValue; onChange: (value: TaskFeedFilterValue) => void }) {
  return <FeedFilterControls kind="tasks" value={value} onChange={onChange} />;
}
