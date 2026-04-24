"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@redwood/shad-ui/components/tabs";
import { TaskFeedList } from "./task-feed-list";

export function TasksFeed() {
  return (
    <Tabs defaultValue="open" className="flex h-full flex-1 flex-col overflow-hidden">
      <TabsList className="mx-auto shrink-0 bg-zinc-900/50">
        <TabsTrigger value="open">Open Tasks</TabsTrigger>
        <TabsTrigger value="all">All Tasks</TabsTrigger>
      </TabsList>
      <TabsContent value="open" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
        <div className="w-3xl flex-1 overflow-hidden">
          <TaskFeedList openOnly />
        </div>
      </TabsContent>
      <TabsContent value="all" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
        <div className="w-3xl flex-1 overflow-hidden">
          <TaskFeedList />
        </div>
      </TabsContent>
    </Tabs>
  );
}
