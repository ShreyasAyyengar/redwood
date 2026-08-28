export const HOTLINE_COLUMN_WIDTHS = {
  call: 200,
  location: 190,
  identifier: 125,
  issue: 300,
  resolution: 300,
  category: 100,
  serviceLocation: 105,
  department: 115,
  actions: 76,
} as const;

const CATEGORY_BADGE_AND_CELL_SPACE = 52;
const CATEGORY_CHARACTER_WIDTH = 7.5;

export function getHotlineCategoryColumnWidth(categories: ReadonlyArray<{ label: string }>) {
  const longestLabelLength = categories.reduce((length, category) => Math.max(length, category.label.length), 0);
  const contentWidth = Math.ceil(longestLabelLength * CATEGORY_CHARACTER_WIDTH + CATEGORY_BADGE_AND_CELL_SPACE);
  return Math.max(HOTLINE_COLUMN_WIDTHS.category, contentWidth);
}
