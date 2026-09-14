import { IssuesFeed } from "#/features/issues/components/feed/issues-feed.tsx";

export default function IssuesPage() {
  return (
    <div className="flex min-h-0 w-full flex-1 overflow-hidden p-5">
      <IssuesFeed />
    </div>
  );
}
