import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { WarehouseSort } from '../api/enterprise';
import {
  ErrorState,
  FilterInput,
  LoadingSkeleton,
  PageCard,
  PageHeader,
  Pagination,
  SortSelect,
  Table,
  TableArea,
} from '../components';
import { usePageSize } from '../context/PageSizeContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useWarehouses } from '../hooks/useEnterprise';
import { useResetPageOnFilterChange } from '../hooks/useResetPageOnFilterChange';
import { PAGE_DESCRIPTIONS } from '../lib/pageMeta';

export function WarehousesPage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<WarehouseSort>('name');
  const [page, setPage] = useState(1);
  const { pageSize } = usePageSize();

  const searchParam = useDebouncedValue(search.trim(), 300) || undefined;
  useResetPageOnFilterChange(setPage, [searchParam, sort, pageSize]);

  const { data, isLoading, isFetching, error } = useWarehouses(searchParam, sort, { page, pageSize });
  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const tableLoading = isFetching && !isLoading;

  if (error && !data) return <ErrorState message="Failed to load warehouses" />;

  return (
    <div>
      <PageHeader title="Warehouses" description={PAGE_DESCRIPTIONS.warehouses} />
      <PageCard>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <FilterInput
            value={search}
            onChange={setSearch}
            placeholder="Code, name, address..."
            className="w-full sm:w-72"
          />
          <SortSelect
            value={sort}
            onChange={(value) => setSort(value as WarehouseSort)}
            defaultValue="name"
            className="shrink-0"
            options={[
              { value: 'name', label: 'Sort: Name' },
              { value: 'code', label: 'Sort: Code' },
            ]}
          />
        </div>
        <TableArea loading={tableLoading}>
          {isLoading && !data ? (
            <LoadingSkeleton rows={6} />
          ) : (
            <>
              <Table headers={['Code', 'Name', 'Address', 'Status', '']}>
                {rows.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-4 text-sm font-medium">{w.code}</td>
                    <td className="px-4 py-4 text-sm">{w.name}</td>
                    <td className="px-4 py-4 text-sm">{w.address ?? '—'}</td>
                    <td className="px-4 py-4 text-sm">{w.is_active ? 'Active' : 'Inactive'}</td>
                    <td className="px-4 py-4 text-sm">
                      <Link to={`/warehouses/${w.id}`} className="text-brand hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
                {total === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No warehouses found</td>
                  </tr>
                )}
              </Table>
              <Pagination page={page} total={pages} onChange={setPage} totalItems={total} />
            </>
          )}
        </TableArea>
      </PageCard>
    </div>
  );
}
