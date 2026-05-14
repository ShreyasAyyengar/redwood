"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@redwood/shad-ui/components/tabs";
import { useMemo, useState } from "react";
import { FeedRoomFilter, type FeedRoomFilterValue } from "../feed-room-filter";
import { TaskFeedList } from "./task-feed-list";

export function TasksFeed() {
  const [roomFilter, setRoomFilter] = useState<FeedRoomFilterValue | undefined>();
  const taskFilter = useMemo(
    () => (roomFilter?.group ? { group: roomFilter.group, classroomId: roomFilter.classroomId } : undefined),
    [roomFilter?.classroomId, roomFilter?.group]
  );

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <Tabs defaultValue="open" className="flex h-full flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 flex-col items-center gap-4 pb-4">
          <TabsList className="mx-auto shrink-0 bg-zinc-900/50">
            <TabsTrigger value="open">Open Tasks</TabsTrigger>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
          </TabsList>
          <FeedRoomFilter value={roomFilter} onChange={setRoomFilter} />
        </div>
        <TabsContent value="open" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
          <div className="w-3xl flex-1 overflow-hidden">
            <TaskFeedList filter={taskFilter} openOnly />
          </div>
        </TabsContent>
        <TabsContent value="all" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
          <div className="w-3xl flex-1 overflow-hidden">
            <TaskFeedList filter={taskFilter} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
