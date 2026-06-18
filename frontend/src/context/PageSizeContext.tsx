import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { PAGE_SIZE } from '../lib/utils';

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

const STORAGE_KEY = 'inventory.pageSize';

interface PageSizeContextValue {
  pageSize: number;
  setPageSize: (size: PageSizeOption) => void;
  options: readonly PageSizeOption[];
}

const PageSizeContext = createContext<PageSizeContextValue | null>(null);

function readStoredPageSize(): number {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return PAGE_SIZE;
  const parsed = Number(saved);
  return PAGE_SIZE_OPTIONS.includes(parsed as PageSizeOption) ? parsed : PAGE_SIZE;
}

export function PageSizeProvider({ children }: { children: ReactNode }) {
  const [pageSize, setPageSizeState] = useState(readStoredPageSize);

  const setPageSize = useCallback((size: PageSizeOption) => {
    setPageSizeState(size);
    localStorage.setItem(STORAGE_KEY, String(size));
  }, []);

  const value = useMemo(
    () => ({ pageSize, setPageSize, options: PAGE_SIZE_OPTIONS }),
    [pageSize, setPageSize],
  );

  return <PageSizeContext.Provider value={value}>{children}</PageSizeContext.Provider>;
}

export function usePageSize() {
  const ctx = useContext(PageSizeContext);
  if (!ctx) {
    throw new Error('usePageSize must be used within PageSizeProvider');
  }
  return ctx;
}
