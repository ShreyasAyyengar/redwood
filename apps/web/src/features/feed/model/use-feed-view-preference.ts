"use client";

import { useCallback, useEffect, useState } from "react";
import type { FeedView } from "../components/feed-view-layout";

const FEED_VIEW_STORAGE_KEY = "redwood:feed-view";

export function useFeedViewPreference() {
  const [view, setView] = useState<FeedView>("list");

  useEffect(() => {
    try {
      const storedView = localStorage.getItem(FEED_VIEW_STORAGE_KEY);
      if (storedView === "list" || storedView === "cards") setView(storedView);
    } catch {
      // Keep the default when browser storage is unavailable.
    }
  }, []);

  const setPreferredView = useCallback((nextView: FeedView) => {
    setView(nextView);
    try {
      localStorage.setItem(FEED_VIEW_STORAGE_KEY, nextView);
    } catch {
      // Switching views still works when the preference cannot be saved.
    }
  }, []);

  return [view, setPreferredView] as const;
}
