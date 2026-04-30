"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@redwood/shad-ui/components/tabs";
import { useMemo, useState } from "react";
import { FeedRoomFilter, type FeedRoomFilterValue } from "../feed-room-filter";
import { IssueFeedList } from "./issue-feed-list";

export function IssuesFeed() {
  const [roomFilter, setRoomFilter] = useState<FeedRoomFilterValue | undefined>();
  const issueFilter = useMemo(
    () => (roomFilter?.group ? { group: roomFilter.group, classroomId: roomFilter.classroomId } : undefined),
    [roomFilter?.classroomId, roomFilter?.group]
  );

  return (
    <Tabs defaultValue="open" className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col items-center gap-4 pb-4">
        <TabsList className="mx-auto shrink-0 bg-zinc-900/50">
          <TabsTrigger value="open">Open Issues</TabsTrigger>
          <TabsTrigger value="all">All Issues</TabsTrigger>
        </TabsList>
        <FeedRoomFilter value={roomFilter} onChange={setRoomFilter} />
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
