import type { PaginationResult } from "convex/server";

type FeedDocument = { _id: string } & Record<string, unknown>;

export async function collectFeedPages<T extends FeedDocument>(
  fetchPage: (cursor: string | null) => Promise<PaginationResult<T>>,
  onProgress?: (count: number) => void
) {
  const documents = new Map<string, T>();
  let cursor: string | null = null;
  const cursors = new Set<string>();
  let result: PaginationResult<T>;

  do {
    // biome-ignore lint/performance/noAwaitInLoops: Each page requires the previous page's cursor.
    result = await fetchPage(cursor);
    for (const document of result.page) documents.set(document._id, document);
    onProgress?.(documents.size);
    if (!result.isDone) {
      if (cursors.has(result.continueCursor)) throw new Error("Export pagination stopped advancing. Please try again.");
      cursors.add(result.continueCursor);
      cursor = result.continueCursor;
    }
  } while (!result.isDone);
  return [...documents.values()];
}

function csvCell(value: unknown) {
  const text = value === undefined || value === null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

// Preserve the raw top-level Convex fields, including system fields. Nested
// objects and arrays are JSON cells so their original structure survives.
export function feedDocumentsToCsv(documents: FeedDocument[]) {
  const columns = [...new Set(documents.flatMap((document) => Object.keys(document)))].sort();
  return [columns.map(csvCell).join(","), ...documents.map((document) => columns.map((column) => csvCell(document[column])).join(","))].join(
    "\r\n"
  );
}
