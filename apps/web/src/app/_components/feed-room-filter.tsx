"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@redwood/shad-ui/components/select";
import { useQuery } from "@tanstack/react-query";
import { DoorOpen, LayoutGrid } from "lucide-react";
import { useMemo } from "react";
import { webClientORPC } from "../../lib/orpc-web-client";
import { useFetchedRoomsStore } from "./room-store";

const ALL_GROUPS_VALUE = "ALL_GROUPS";
const ALL_ROOMS_VALUE = "ALL_ROOMS";
const PICK_GROUP_VALUE = "PICK_GROUP";
const UNGROUPED_GROUP = "Ungrouped";

export type FeedRoomFilterValue = {
  classroomId?: string;
  group?: string;
};

type FeedRoomFilterProps = {
  onChange: (filter: FeedRoomFilterValue | undefined) => void;
  value: FeedRoomFilterValue | undefined;
};

export function FeedRoomFilter({ onChange, value }: FeedRoomFilterProps) {
  const { data: groups } = useQuery(webClientORPC.groups.getGroups.queryOptions());
  const { fetchedRooms } = useFetchedRoomsStore();

  const groupOptions = useMemo(() => {
    const labels = groups?.map((group) => group.label) ?? [];
    return Array.from(new Set([...labels, UNGROUPED_GROUP]));
  }, [groups]);

  const roomsForGroup = useMemo(() => {
    if (!value?.group) return [];

    return [...fetchedRooms].filter((room) => room.groupKey === value.group).sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [fetchedRooms, value?.group]);

  const setGroup = (group: string) => {
    onChange(group === ALL_GROUPS_VALUE ? undefined : { group });
  };

  const setClassroom = (classroomId: string) => {
    if (!value?.group) return;
    onChange({
      group: value.group,
      classroomId: classroomId === ALL_ROOMS_VALUE ? undefined : classroomId,
    });
  };

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3 px-4 sm:flex-row sm:items-end sm:justify-center">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-60">
        <div className="flex items-center gap-2 px-1">
          <LayoutGrid className="size-3.5 text-neutral-500" />
          <span className="font-bold text-[10px] text-neutral-500 uppercase tracking-[0.2em]">Room Group</span>
        </div>
        <Select value={value?.group ?? ALL_GROUPS_VALUE} onValueChange={setGroup}>
          <SelectTrigger className="h-10 w-full min-w-0 border-white/5 bg-neutral-900/60 text-neutral-200 shadow-sm transition-colors hover:bg-neutral-900/80 [&>span]:min-w-0 [&>span]:truncate">
            <SelectValue placeholder="All Groups" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-neutral-900 text-neutral-200">
            <SelectItem value={ALL_GROUPS_VALUE}>All Groups</SelectItem>
            {groupOptions.map((group) => (
              <SelectItem key={group} value={group}>
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-72">
        <div className="flex items-center gap-2 px-1">
          <DoorOpen className="size-3.5 text-neutral-500" />
          <span className="font-bold text-[10px] text-neutral-500 uppercase tracking-[0.2em]">Classroom</span>
        </div>
        <Select
          disabled={!value?.group}
          value={value?.group ? (value.classroomId ?? ALL_ROOMS_VALUE) : PICK_GROUP_VALUE}
          onValueChange={setClassroom}
        >
          <SelectTrigger className="h-10 w-full min-w-0 border-white/5 bg-neutral-900/60 text-neutral-200 shadow-sm transition-colors hover:bg-neutral-900/80 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:min-w-0 [&>span]:truncate">
            <SelectValue placeholder="Pick a group first" />
          </SelectTrigger>
          <SelectContent className="border-white/10 bg-neutral-900 text-neutral-200">
            {value?.group ? (
              <>
                <SelectItem value={ALL_ROOMS_VALUE}>All Rooms</SelectItem>
                {roomsForGroup.map((room) => (
                  <SelectItem key={room._id} value={room._id}>
                    {room.displayName}
                  </SelectItem>
                ))}
              </>
            ) : (
              <SelectItem disabled value={PICK_GROUP_VALUE}>
                Pick a group first
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
