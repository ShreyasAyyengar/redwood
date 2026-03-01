"use client";

import type { classroomSchema } from "@redwood/contracts";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import type { z } from "zod";
import { dayAvailability, getBlocksForToday, getCaliClock, toSortKey } from "../../../util/util";
import AvailabilityCell from "./availability/availability-cell";
import AvailabilityHeader from "./availability/availability-header";
import LastServicedCell from "./last-serviced/last-serviced-cell";
import LastServicedHeader from "./last-serviced/last-serviced-header";
import NameCell from "./name/name-cell";
import NameHeader from "./name/name-header";
import StatusCell from "./status/status-cell";
import StatusHeader from "./status/status-header";
import OpenTasksCell from "./tasks/open-tasks-cell";
import OpenTasksHeader from "./tasks/open-tasks-header";

const statusOrder: Record<string, number> = {
  "NEEDS URGENT ATTENTION": 0,
  "NEEDS ATTENTION": 1,
  GOOD: 2,
};

const columnHelper = createColumnHelper<z.infer<typeof classroomSchema>>();
// TODO find better type for `any`
export const columns: ColumnDef<z.infer<typeof classroomSchema>, any>[] = [
  columnHelper.accessor("displayName", {
    header: ({ column }) => <NameHeader column={column} />,
    cell: ({ row }) => <NameCell row={row} />,
    sortingFn: (rowA, rowB) => rowA.original.displayName.localeCompare(rowB.original.displayName),
  }),

  columnHelper.accessor("schedule", {
    header: ({ column }) => <AvailabilityHeader column={column} />,
    cell: ({ row }) => <AvailabilityCell row={row} />,
    sortingFn: (rowA, rowB) => {
      const { weekdayKey, nowMin } = getCaliClock();
      // biome-ignore lint/style/noNonNullAssertion: this can only be invoked by a classroom displayed with a schedule
      const aBlocks = getBlocksForToday(rowA.original.schedule!, weekdayKey);
      // biome-ignore lint/style/noNonNullAssertion: this can only be invoked by a classroom displayed with a schedule
      const bBlocks = getBlocksForToday(rowB.original.schedule!, weekdayKey);

      const aKey = toSortKey(dayAvailability(aBlocks, nowMin));
      const bKey = toSortKey(dayAvailability(bBlocks, nowMin));

      if (aKey.group !== bKey.group) return aKey.group - bKey.group;
      if (aKey.time !== bKey.time) return aKey.time - bKey.time;
      return rowA.original.displayName.localeCompare(rowB.original.displayName);
    },
  }),

  columnHelper.accessor("lastMaintenance", {
    header: ({ column }) => <LastServicedHeader column={column} />,
    cell: ({ row }) => <LastServicedCell row={row} />,
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.lastMaintenance?.date;
      const b = rowB.original.lastMaintenance?.date;
      if (!a && !b) return 0;
      if (!a) return 1;
      if (!b) return -1;
      return a.getTime() - b.getTime();
    },
  }),

  columnHelper.accessor("roomStatus", {
    header: ({ column }) => <StatusHeader column={column} />,
    cell: ({ row }) => <StatusCell row={row} />,
    // biome-ignore lint/style/noNonNullAssertion: everything is strongly typed
    sortingFn: (rowA, rowB) => statusOrder[rowA.original.roomStatus]! - statusOrder[rowB.original.roomStatus]!,
  }),

  columnHelper.accessor("openTasksCount", {
    header: ({ column }) => <OpenTasksHeader column={column} />,
    cell: ({ row }) => <OpenTasksCell row={row} />,
    sortingFn: (rowA, rowB) => rowA.original.openTasksCount - rowB.original.openTasksCount,
  }),
];
