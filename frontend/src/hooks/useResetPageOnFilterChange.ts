import { useEffect } from 'react';

export function useResetPageOnFilterChange(setPage: (page: number) => void, deps: unknown[]) {
  useEffect(() => {
    setPage(1);
  }, deps);
}
