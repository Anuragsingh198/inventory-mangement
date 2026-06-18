import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PurchaseOrderSort } from '../api/enterprise';
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
import { useEnterpriseMutations, usePurchaseOrders } from '../hooks/useEnterprise';
import { useResetPageOnFilterChange } from '../hooks/useResetPageOnFilterChange';
import { PAGE_DESCRIPTIONS } from '../lib/pageMeta';
import { formatDate, formatOrderId } from '../lib/utils';
import {
  canApprovePO,
  canApprovePurchaseOrder,
  canReceivePO,
  canReceivePurchaseOrder,
} from '../types';

function poStatusVariant(status: string): 'success' | 'warning' | 'danger' {
  if (status === 'received') return 'success';
  if (status === 'cancelled') return 'danger';
  return 'warning';
}

export function PurchasesPage() {
  const { approvePO, receivePO } = useEnterpriseMutations();
  const { user } = useAuth();
  const role = user?.role;
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<PurchaseOrderSort>('newest');
  const [page, setPage] = useState(1);
  const { pageSize } = usePageSize();

  const searchParam = useDebouncedValue(search.trim(), 300) || undefined;
  useResetPageOnFilterChange(setPage, [searchParam, sort, pageSize]);

  const { data, isLoading, isFetching, error } = usePurchaseOrders(searchParam, sort, { page, pageSize });
  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const tableLoading = isFetching && !isLoading;

  if (error && !data) return <ErrorState message="Failed to load purchase orders" />;

  return (
    <div>
      <PageHeader title="Purchase Orders" description={PAGE_DESCRIPTIONS.purchases} />
      <PageCard>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <FilterInput
            value={search}
            onChange={setSearch}
            placeholder="PO #, supplier, status..."
            className="w-full sm:w-72"
          />
          <SortSelect
            value={sort}
            onChange={(value) => setSort(value as PurchaseOrderSort)}
            defaultValue="newest"
            className="shrink-0"
            options={[
              { value: 'newest', label: 'Sort: Newest' },
              { value: 'oldest', label: 'Sort: Oldest' },
              { value: 'supplier', label: 'Sort: Supplier' },
            ]}
          />
        </div>
        <TableArea loading={tableLoading}>
          {isLoading && !data ? (
            <LoadingSkeleton rows={6} />
          ) : (
            <>
              <Table headers={['PO #', 'Supplier', 'Status', 'Items', 'Created', 'Actions']}>
                {rows.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-4 text-sm font-medium">#{formatOrderId(po.id)}</td>
                    <td className="px-4 py-4 text-sm">{po.supplier?.name ?? po.supplier_id}</td>
                    <td className="px-4 py-4">
                      <Badge variant={poStatusVariant(po.status)}>{po.status.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="px-4 py-4 text-sm">{po.items.length}</td>
                    <td className="px-4 py-4 text-sm text-gray-500">{formatDate(po.created_at)}</td>
                    <td className="px-4 py-4 text-sm">
                      <Link to={`/purchases/${po.id}`} className="mr-3 text-brand hover:underline">View</Link>
                      {canApprovePO(role) && canApprovePurchaseOrder(po) && (
                        <InlineActionButton
                          loading={approvePO.isPending && approvePO.variables === po.id}
                          disabled={approvePO.isPending || receivePO.isPending}
                          onClick={() => approvePO.mutate(po.id)}
                        >
                          Approve
                        </InlineActionButton>
                      )}
                      {canReceivePO(role) && canReceivePurchaseOrder(po) && (
                        <InlineActionButton
                          className="ml-2"
                          loading={receivePO.isPending && receivePO.variables === po.id}
                          disabled={approvePO.isPending || receivePO.isPending}
                          onClick={() => receivePO.mutate(po.id)}
                        >
                          Receive
                        </InlineActionButton>
                      )}
                    </td>
                  </tr>
                ))}
                {total === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No purchase orders found</td>
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
