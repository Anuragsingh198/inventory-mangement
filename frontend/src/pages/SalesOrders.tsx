import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { SalesOrderSort } from '../api/enterprise';
import {
  Badge,
  ErrorState,
  FilterInput,
  LoadingSkeleton,
  InlineActionButton,
  PageCard,
  PageHeader,
  Pagination,
  SortSelect,
  Table,
  TableArea,
} from '../components';
import { useAuth } from '../context/AuthContext';
import { usePageSize } from '../context/PageSizeContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useEnterpriseMutations, useSalesOrders } from '../hooks/useEnterprise';
import { useResetPageOnFilterChange } from '../hooks/useResetPageOnFilterChange';
import { PAGE_DESCRIPTIONS } from '../lib/pageMeta';
import { formatDate, formatOrderId } from '../lib/utils';
import { canFulfillSO, canFulfillSalesOrder } from '../types';

export function SalesOrdersPage() {
  const { fulfillSO } = useEnterpriseMutations();
  const { user } = useAuth();
  const role = user?.role;
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SalesOrderSort>('newest');
  const [page, setPage] = useState(1);
  const { pageSize } = usePageSize();

  const searchParam = useDebouncedValue(search.trim(), 300) || undefined;
  useResetPageOnFilterChange(setPage, [searchParam, sort, pageSize]);

  const { data, isLoading, isFetching, error } = useSalesOrders(searchParam, sort, { page, pageSize });
  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const tableLoading = isFetching && !isLoading;

  if (error && !data) return <ErrorState message="Failed to load sales orders" />;

  return (
    <div>
      <PageHeader title="Sales Orders" description={PAGE_DESCRIPTIONS.sales} />
      <PageCard>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <FilterInput
            value={search}
            onChange={setSearch}
            placeholder="SO #, customer, status..."
            className="w-full sm:w-72"
          />
          <SortSelect
            value={sort}
            onChange={(value) => setSort(value as SalesOrderSort)}
            defaultValue="newest"
            className="shrink-0"
            options={[
              { value: 'newest', label: 'Sort: Newest' },
              { value: 'oldest', label: 'Sort: Oldest' },
              { value: 'customer', label: 'Sort: Customer' },
            ]}
          />
        </div>
        <TableArea loading={tableLoading}>
          {isLoading && !data ? (
            <LoadingSkeleton rows={6} />
          ) : (
            <>
              <Table headers={['SO #', 'Customer', 'Status', 'Items', 'Created', 'Actions']}>
                {rows.map((so) => (
                  <tr key={so.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-4 text-sm font-medium">#{formatOrderId(so.id)}</td>
                    <td className="px-4 py-4 text-sm">{so.customer?.name ?? so.customer_id}</td>
                    <td className="px-4 py-4">
                      <Badge variant={so.status === 'fulfilled' ? 'success' : 'warning'}>{so.status}</Badge>
                    </td>
                    <td className="px-4 py-4 text-sm">{so.items.length}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{formatDate(so.created_at)}</td>
                    <td className="px-4 py-4 text-sm">
                      <Link to={`/sales/${so.id}`} className="mr-3 text-brand hover:underline">View</Link>
                      {canFulfillSO(role) && canFulfillSalesOrder(so) && (
                        <InlineActionButton
                          loading={fulfillSO.isPending && fulfillSO.variables === so.id}
                          disabled={fulfillSO.isPending}
                          onClick={() => fulfillSO.mutate(so.id)}
                        >
                          Fulfill
                        </InlineActionButton>
                      )}
                    </td>
                  </tr>
                ))}
                {total === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No sales orders found</td>
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
