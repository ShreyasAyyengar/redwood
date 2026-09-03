import type { Doc } from "@backend/convex/_generated/dataModel";
import { columnSizingFeature, tableFeatures } from "@tanstack/react-table";

export const hotlineTableFeatures = tableFeatures({ columnSizingFeature });

export type HotlineTableItem = {
  categoryLabel: string;
  entry: Doc<"hotline">;
  room?: Doc<"classrooms">;
};

export type HotlineTableProps = {
  canManageCategories: boolean;
  categories: Doc<"hotlineCategories">[];
  classrooms: Doc<"classrooms">[];
  currentUserEmail: string;
  editingEntry?: Doc<"hotline">;
  entries: Doc<"hotline">[] | undefined;
  isAdmin: boolean;
  isCreating: boolean;
  onCancelCreate: () => void;
  onCreateSuccess: () => void;
  onCancelEdit: () => void;
  onEditSuccess: () => void;
  onEdit: (entry: Doc<"hotline">) => void;
  users: Array<{ email: string }>;
};
