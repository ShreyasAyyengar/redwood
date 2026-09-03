import { Button } from "@redwood/shad-ui/components/button";
import { Settings } from "lucide-react";

export function CategoryHeader({
  canManageCategories,
  onOpenCategoryManager,
}: {
  canManageCategories: boolean;
  onOpenCategoryManager: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span>Category</span>
      {canManageCategories && (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="size-6 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200"
          aria-label="Manage hotline categories"
          title="Manage hotline categories"
          onClick={onOpenCategoryManager}
        >
          <Settings className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
