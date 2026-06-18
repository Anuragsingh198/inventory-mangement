import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { SupplierSort } from '../api/enterprise';
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
import { useSuppliers } from '../hooks/useEnterprise';
import { useResetPageOnFilterChange } from '../hooks/useResetPageOnFilterChange';
import { PAGE_DESCRIPTIONS } from '../lib/pageMeta';
import { formatDate } from '../lib/utils';

export function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SupplierSort>('name');
  const [page, setPage] = useState(1);
  const { pageSize } = usePageSize();

  const searchParam = useDebouncedValue(search.trim(), 300) || undefined;
  useResetPageOnFilterChange(setPage, [searchParam, sort, pageSize]);

  const { data, isLoading, isFetching, error } = useSuppliers(searchParam, sort, { page, pageSize });
  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const tableLoading = isFetching && !isLoading;

  if (error && !data) return <ErrorState message="Failed to load suppliers" />;

  return (
    <div>
      <PageHeader title="Suppliers" description={PAGE_DESCRIPTIONS.suppliers} />
      <PageCard>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <FilterInput
            value={search}
            onChange={setSearch}
            placeholder="Name, contact, email, phone..."
            className="w-full sm:w-72"
          />
          <SortSelect
            value={sort}
            onChange={(value) => setSort(value as SupplierSort)}
            defaultValue="name"
            className="shrink-0"
            options={[
              { value: 'name', label: 'Sort: Name' },
              { value: 'rating', label: 'Sort: Rating' },
              { value: 'newest', label: 'Sort: Newest' },
            ]}
          />
        </div>
        <TableArea loading={tableLoading}>
          {isLoading && !data ? (
            <LoadingSkeleton rows={6} />
          ) : (
            <>
              <Table headers={['Name', 'Contact', 'Email', 'Phone', 'Rating', 'Added', '']}>
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-4 text-sm font-medium">{s.name}</td>
                    <td className="px-4 py-4 text-sm">{s.contact_name ?? '—'}</td>
                    <td className="px-4 py-4 text-sm">{s.email ?? '—'}</td>
                    <td className="px-4 py-4 text-sm">{s.phone ?? '—'}</td>
                    <td className="px-4 py-4 text-sm">{s.rating ?? '—'}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{formatDate(s.created_at)}</td>
                    <td className="px-4 py-4 text-sm">
                      <Link to={`/suppliers/${s.id}`} className="text-brand hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
                {total === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No suppliers found</td>
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
