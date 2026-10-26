import type { PaginatedQueryArgs, PaginatedQueryReference } from "convex/react";
import { usePaginatedQuery } from "convex-helpers/react/cache/hooks";
import { useEffect } from "react";

const COUNT_PAGE_SIZE = 500;

export function useFeedCount<Query extends PaginatedQueryReference>(query: Query, args: PaginatedQueryArgs<Query>) {
  const { results, status, loadMore } = usePaginatedQuery(query, args, { initialNumItems: COUNT_PAGE_SIZE, customPagination: true });

  useEffect(() => {
    if (status === "CanLoadMore") loadMore(COUNT_PAGE_SIZE);
  }, [loadMore, status]);

  return status === "Exhausted" ? results.length : undefined;
}
