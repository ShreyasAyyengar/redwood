import type { Doc } from "@backend/convex/_generated/dataModel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@redwood/shad-ui/components/select";

type CategoryControlProps = {
  categories: Doc<"hotlineCategories">[];
  invalid: boolean;
  onChange: (value: string) => void;
  value: string;
};

export function CategoryControl({ categories, invalid, onChange, value }: CategoryControlProps) {
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={categories.length === 0}>
      <SelectTrigger aria-label="Hotline category" aria-invalid={invalid} className="w-full border-zinc-700 bg-zinc-900/80 px-2 text-xs">
        <SelectValue placeholder="Category" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category._id} value={category._id}>
            {category.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
