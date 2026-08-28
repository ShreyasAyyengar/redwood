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
      cell: ({ getValue }) => <p className="line-clamp-3 whitespace-pre-wrap text-sm text-zinc-300 leading-5">{getValue()}</p>,
    }),
    columnHelper.accessor((item) => item.entry.calleeResolution, {
      id: "resolution",
      header: "Resolution",
      size: HOTLINE_COLUMN_WIDTHS.resolution,
      cell: ({ getValue }) => (
        <p className={cn("line-clamp-3 whitespace-pre-wrap text-sm leading-5", getValue() ? "text-zinc-300" : "text-zinc-600")}>
          {getValue() || "No resolution recorded"}
        </p>
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
    columnHelper.display({
      id: "actions",
      header: "",
      size: HOTLINE_COLUMN_WIDTHS.actions,
      cell: () => null,
    }),
  ]);
}
