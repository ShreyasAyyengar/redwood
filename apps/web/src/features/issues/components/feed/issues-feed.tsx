"use client";

import { Button } from "@redwood/shad-ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@redwood/shad-ui/components/tabs";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { FeedRoomFilter, type FeedRoomFilterValue } from "#/features/classrooms/components/feed-room-filter.tsx";
import { authClientWeb } from "#/lib/auth-client-web.ts";
import { hasSupervisorAccess } from "#/lib/permissions.ts";
import type { IssueFeedFilterValue } from "../../model/issue-filters";
import { BulkIssueDialog } from "../dialogs/bulk-issue-dialog";
import { IssueFeedFilters } from "./issue-feed-filters";
import { IssueFeedList } from "./issue-feed-list";

export function IssuesFeed() {
  const [roomFilter, setRoomFilter] = useState<FeedRoomFilterValue | undefined>();
  const [feedFilter, setFeedFilter] = useState<IssueFeedFilterValue>({});
  const { data: session } = authClientWeb.useSession();
  const canBulkCreate = hasSupervisorAccess(session?.user.role);
  const issueFilter = useMemo(
    () => ({
      ...feedFilter,
      ...(roomFilter?.group ? { group: roomFilter.group, classroomId: roomFilter.classroomId } : {}),
    }),
    [feedFilter, roomFilter?.classroomId, roomFilter?.group]
  );

  return (
    <Tabs defaultValue="open" className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col items-center gap-4 pb-4">
        <div className="flex items-center justify-center gap-4">
          <TabsList className="mx-auto shrink-0 bg-zinc-900/50">
            <TabsTrigger value="open">Open Issues</TabsTrigger>
            <TabsTrigger value="all">All Issues</TabsTrigger>
          </TabsList>
          {canBulkCreate && (
            <BulkIssueDialog>
              <Button className="h-2/3 px-0.5 active:scale-95 active:transform">
                <Plus className="size-4" />
                Bulk Add Issues
              </Button>
            </BulkIssueDialog>
          )}
        </div>
        <FeedRoomFilter value={roomFilter} onChange={setRoomFilter} />
        <IssueFeedFilters value={feedFilter} onChange={setFeedFilter} />
      </div>
      <TabsContent value="open" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
        <div className="w-3xl flex-1 overflow-hidden">
          <IssueFeedList filter={issueFilter} openOnly />
        </div>
      </TabsContent>
      <TabsContent value="all" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
        <div className="w-3xl flex-1 overflow-hidden">
          <IssueFeedList filter={issueFilter} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
