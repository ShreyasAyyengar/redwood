"use client";

import { Button } from "@redwood/shad-ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@redwood/shad-ui/components/tabs";
import type { PaginationResult } from "convex/server";
import { Download, LayoutGrid, List, Loader2 } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { downloadFeedCsv } from "../model/download-feed-csv";
import { collectFeedPages } from "../model/feed-csv";

export type FeedView = "list" | "cards";

function FeedCsvExportButton<T extends { _id: string } & Record<string, unknown>>({
  fetchPage,
  filename,
  disabled,
}: {
  fetchPage: (cursor: string | null) => Promise<PaginationResult<T>>;
  filename: string;
  disabled?: boolean;
}) {
  const busy = useRef<boolean>(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportCsv = async () => {
    if (busy.current) return;
    busy.current = true;
    setError(null);
    setProgress(0);
    try {
      const documents = await collectFeedPages(fetchPage, setProgress);
      downloadFeedCsv(documents, filename);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "CSV export failed. Please try again.");
    } finally {
      busy.current = false;
      setProgress(null);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" disabled={disabled || progress !== null} onClick={exportCsv}>
        {progress === null ? <Download className="size-3.5" /> : <Loader2 className="size-3.5 animate-spin" />}
        <span aria-live="polite">{progress === null ? "Export CSV" : `Exporting ${progress.toLocaleString()}…`}</span>
      </Button>
      {error && (
        <p role="alert" className="max-w-sm text-right text-red-400 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

export function FeedViewLayout<T extends { _id: string } & Record<string, unknown>>({
  view,
  onViewChange,
  total,
  noun,
  fetchExportPage,
  filename,
  list,
  cards,
}: {
  view: FeedView;
  onViewChange: (view: FeedView) => void;
  total?: number;
  noun: "issues" | "tasks";
  fetchExportPage: (cursor: string | null) => Promise<PaginationResult<T>>;
  filename: string;
  list: ReactNode;
  cards: ReactNode;
}) {
  return (
    <Tabs value={view} onValueChange={(value) => onViewChange(value as FeedView)} className="flex h-full min-h-0 w-full min-w-0 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TabsList aria-label={`${noun} view`} className="bg-zinc-900/70">
            <TabsTrigger value="list">
              <List className="size-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="cards">
              <LayoutGrid className="size-4" />
              Cards
            </TabsTrigger>
          </TabsList>
          {view === "list" && <span className="hidden text-xs text-zinc-500 sm:inline">Double-click a row to open</span>}
        </div>
        <div className="ml-auto flex items-center gap-4">
          <span role="status" className="text-sm text-zinc-400 tabular-nums">
            {total === undefined ? (
              "Counting results…"
            ) : (
              <>
                <span className="font-medium text-zinc-200">{total.toLocaleString()}</span> results
              </>
            )}
          </span>
          <FeedCsvExportButton fetchPage={fetchExportPage} filename={filename} disabled={total === 0} />
        </div>
      </div>
      <TabsContent value="list" className="mt-0 min-h-0 overflow-hidden">
        {list}
      </TabsContent>
      <TabsContent value="cards" className="mt-0 min-h-0 overflow-hidden">
        {cards}
      </TabsContent>
    </Tabs>
  );
}
