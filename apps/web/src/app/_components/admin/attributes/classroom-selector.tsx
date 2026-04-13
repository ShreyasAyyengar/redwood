import type { attributeSchema } from "@redwood/contracts";
import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { Search } from "lucide-react";
import { useState } from "react";
import type { z } from "zod";
import { useAttributeStore } from "./attribute-store";
import { ClassroomCard } from "./classroom-select-card";

export function ClassroomSelector({ availableAttributes }: { availableAttributes: z.infer<typeof attributeSchema>[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const { classrooms, selectedClassroomIds, selectAllClassrooms, deselectAllClassrooms } = useAttributeStore();

  const selectedCount = selectedClassroomIds.length;
  const isAllSelected = selectedCount === classrooms.length && classrooms.length > 0;

  const filteredClassrooms = classrooms.filter(
    (c) => c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || c.groupKey.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      deselectAllClassrooms();
    } else {
      selectAllClassrooms();
    }
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-zinc-800 bg-neutral-900 p-5">
      <div className="mb-4 flex shrink-0 flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-lg text-zinc-100">
            Classrooms
            {selectedCount > 0 && <span className="font-normal text-sm text-zinc-400">({selectedCount} selected)</span>}
          </h2>
          <p className="mt-1 text-xs text-zinc-400">Select classrooms to batch edit their attributes</p>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative flex-1 sm:min-w-[200px]">
            <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-950 py-1.5 pr-4 pl-9 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 font-medium text-sm text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            {isAllSelected ? "Deselect All" : "Select All"}
          </button>
        </div>
      </div>

      {filteredClassrooms.length > 0 ? (
        <div className="min-h-0 flex-1">
          <ScrollArea className="h-full px-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredClassrooms.map((classroom) => (
                <ClassroomCard key={classroom._id} classroom={classroom} availableAttributes={availableAttributes} />
              ))}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-zinc-800 border-dashed bg-zinc-950/50 py-12 text-center">
          <div className="mb-3 rounded-full bg-zinc-800 p-3">
            <Search className="h-6 w-6 text-zinc-500" />
          </div>
          <h3 className="font-medium text-sm text-zinc-100">No rooms found</h3>
          <p className="mt-1 text-xs text-zinc-400">Try adjusting your search query</p>
        </div>
      )}
    </div>
  );
}
