"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@redwood/shad-ui/components/tabs";
import { IssueFeedList } from "./issue-feed-list";

export function IssuesFeed() {
  return (
    <Tabs defaultValue="open" className="flex h-full flex-1 flex-col overflow-hidden">
      <TabsList className="mx-auto shrink-0 bg-zinc-900/50">
        <TabsTrigger value="open">Open Issues</TabsTrigger>
        <TabsTrigger value="all">All Issues</TabsTrigger>
      </TabsList>
      <TabsContent value="open" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
        <div className="w-3xl flex-1 overflow-hidden">
          <IssueFeedList openOnly />
        </div>
      </TabsContent>
      <TabsContent value="all" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
        <div className="w-3xl flex-1 overflow-hidden">
          <IssueFeedList />
        </div>
      </TabsContent>
    </Tabs>
  );
}
