import { feedDocumentsToCsv } from "./feed-csv";

const DOWNLOAD_URL_LIFETIME_MS = 1000;

export function downloadFeedCsv(documents: ({ _id: string } & Record<string, unknown>)[], filename: string) {
  const url = URL.createObjectURL(new Blob(["\uFEFF", feedDocumentsToCsv(documents)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // Keep the URL alive until the browser has started the download.
  setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_URL_LIFETIME_MS);
}
