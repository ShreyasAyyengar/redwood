import { FeedFilterControls } from "@/features/feed/components/feed-filter-controls";
import type { IssueFeedFilterValue } from "../../model/issue-filters";

export function IssueFeedFilters({ value, onChange }: { value: IssueFeedFilterValue; onChange: (value: IssueFeedFilterValue) => void }) {
  return <FeedFilterControls kind="issues" value={value} onChange={onChange} />;
}
