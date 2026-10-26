"use client";

import { Button } from "@redwood/shad-ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@redwood/shad-ui/components/tabs";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useFeedViewPreference } from "#/features/feed/model/use-feed-view-preference.ts";
import { authClientWeb } from "#/lib/auth-client-web.ts";
import { hasSupervisorAccess } from "#/lib/permissions.ts";
import type { TaskFeedFilterValue } from "../../model/task-filters";
import { BulkTaskDialog } from "../dialogs/bulk-task-dialog";
import { TaskFeedFilters } from "./task-feed-filters";
import { TaskFeedList } from "./task-feed-list";

export function TasksFeed() {
  const [view, setView] = useFeedViewPreference();
  const [feedFilter, setFeedFilter] = useState<TaskFeedFilterValue>({});
  const { data: session } = authClientWeb.useSession();
  const canBulkCreate = hasSupervisorAccess(session?.user.role);

  return (
    <Tabs defaultValue="open" className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col items-center gap-4 pb-4">
        <div className="flex items-center justify-center gap-4">
          <TabsList className="mx-auto shrink-0 bg-zinc-900/50">
            <TabsTrigger value="open">Open Tasks</TabsTrigger>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
          </TabsList>
          {canBulkCreate && (
            <BulkTaskDialog>
              <Button className="h-2/3 px-0.5 active:scale-95 active:transform">
                <Plus className="size-4" />
                Bulk Add Tasks
              </Button>
            </BulkTaskDialog>
          )}
        </div>
        <TaskFeedFilters value={feedFilter} onChange={setFeedFilter} />
      </div>
      <TabsContent value="open" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
        <div className="w-full min-w-0 flex-1 overflow-hidden">
          <TaskFeedList filter={feedFilter} openOnly view={view} onViewChange={setView} />
        </div>
      </TabsContent>
      <TabsContent value="all" className="mt-0 flex min-h-0 flex-1 overflow-hidden">
        <div className="w-full min-w-0 flex-1 overflow-hidden">
          <TaskFeedList filter={feedFilter} view={view} onViewChange={setView} />
        </div>
      </TabsContent>
    </Tabs>
  );
}
