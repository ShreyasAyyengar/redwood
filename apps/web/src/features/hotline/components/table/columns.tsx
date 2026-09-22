import { ScrollArea } from "@redwood/shad-ui/components/scroll-area";
import { cn } from "@redwood/shad-ui/lib/utils";
import { createColumnHelper } from "@tanstack/react-table";
import { HOTLINE_COLUMN_WIDTHS } from "../../model/hotline-table-layout.ts";
import { CategoryHeader } from "./category/category-header.tsx";
import { CallDetailsCell } from "./cells/call-details-cell.tsx";
import { CallerIdCell } from "./cells/caller-id-cell.tsx";
import { CategoryCell } from "./cells/category-cell.tsx";
import { DepartmentCell } from "./cells/department-cell.tsx";
import { LocationCell } from "./cells/location-cell.tsx";
import { ServiceCell } from "./cells/service-cell.tsx";
import type { HotlineTableItem, hotlineTableFeatures } from "./table-types.ts";

const columnHelper = createColumnHelper<typeof hotlineTableFeatures, HotlineTableItem>();

function ScrollableTextCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ScrollArea type="auto" className="h-[3.75rem] w-full [&_[data-slot=scroll-area-thumb]]:bg-zinc-600/80">
      <p className={cn("whitespace-pre-wrap break-words pr-3 text-sm leading-5", className)}>{children}</p>
    </ScrollArea>
  );
}

export function createHotlineColumns({
  canManageCategories,
  categoryColumnWidth,
  onOpenCategoryManager,
}: {
  canManageCategories: boolean;
  categoryColumnWidth: number;
  onOpenCategoryManager: () => void;
}) {
  return columnHelper.columns([
    columnHelper.accessor((item) => item.entry.dateOfCall, {
      id: "call",
      header: "Date of call / callee",
      size: HOTLINE_COLUMN_WIDTHS.call,
      cell: ({ row }) => <CallDetailsCell entry={row.original.entry} />,
    }),
    columnHelper.accessor((item) => item.entry.callerLocation, {
      id: "location",
      header: "Caller location",
      size: HOTLINE_COLUMN_WIDTHS.location,
      cell: ({ row }) => <LocationCell item={row.original} />,
    }),
    columnHelper.accessor((item) => item.entry.callerIdentifier, {
      id: "identifier",
      header: "Caller ID",
      size: HOTLINE_COLUMN_WIDTHS.identifier,
      cell: ({ getValue }) => <CallerIdCell value={getValue()} />,
    }),
    columnHelper.accessor((item) => item.entry.callerIssueDescription, {
      id: "issue",
      header: "Caller issue",
      size: HOTLINE_COLUMN_WIDTHS.issue,
      cell: ({ getValue }) => <ScrollableTextCell className="text-zinc-300">{getValue()}</ScrollableTextCell>,
    }),
    columnHelper.accessor((item) => item.entry.calleeResolution, {
      id: "resolution",
      header: "Resolution",
      size: HOTLINE_COLUMN_WIDTHS.resolution,
      cell: ({ getValue }) => (
        <ScrollableTextCell className={getValue() ? "text-zinc-300" : "text-zinc-600"}>
          {getValue() || "No resolution recorded"}
        </ScrollableTextCell>
      ),
    }),
    columnHelper.accessor("categoryLabel", {
      id: "category",
      header: () => <CategoryHeader canManageCategories={canManageCategories} onOpenCategoryManager={onOpenCategoryManager} />,
      size: categoryColumnWidth,
      cell: ({ getValue }) => <CategoryCell value={getValue()} />,
    }),
    columnHelper.accessor((item) => item.entry.serviceLocation, {
      id: "serviceLocation",
      header: "Service",
      size: HOTLINE_COLUMN_WIDTHS.serviceLocation,
      cell: ({ getValue }) => <ServiceCell value={getValue()} />,
    }),
    columnHelper.accessor((item) => item.entry.department, {
      id: "department",
      header: "Department",
      size: HOTLINE_COLUMN_WIDTHS.department,
      cell: ({ getValue }) => <DepartmentCell value={getValue()} />,
    }),
  ]);
}
