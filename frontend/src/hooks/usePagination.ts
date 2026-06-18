import { useEffect, useMemo, useState } from 'react';
import { paginate, PAGE_SIZE, totalPages } from '../lib/utils';

export function usePagination<T>(items: T[], resetKey = '', perPage = PAGE_SIZE) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey, perPage]);

  const pages = totalPages(items.length, perPage);
  const safePage = Math.min(page, pages);

  const paged = useMemo(
    () => paginate(items, safePage, perPage),
    [items, safePage, perPage],
  );

  return { page: safePage, pages, paged, setPage, total: items.length, perPage };
}
