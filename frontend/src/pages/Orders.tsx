import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { OrderSort } from '../api/orders';
import {
  Badge,
  ErrorState,
  FilterInput,
  LoadingSkeleton,
  PageCard,
  PageHeader,
  Pagination,
  HeaderButton,
  SortSelect,
  TabBar,
  Table,
  TableArea,
} from '../components';
import { CreateOrderModal } from '../components/CreateOrderModal';
import { useAuth } from '../context/AuthContext';
import { usePageSize } from '../context/PageSizeContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useOrders } from '../hooks/useOrders';
import { useResetPageOnFilterChange } from '../hooks/useResetPageOnFilterChange';
import { PAGE_DESCRIPTIONS } from '../lib/pageMeta';
import { formatCurrency, formatDate, formatOrderId, orderTotal } from '../lib/utils';
import type { OrderStatus } from '../types';

const ORDER_TABS: { id: OrderStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'received', label: 'Received' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function OrdersPage() {
  const { isAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<OrderSort>('newest');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { pageSize } = usePageSize();
  const status = statusFilter === 'all' ? undefined : (statusFilter as OrderStatus);
  const orderSearch = useDebouncedValue(search.trim(), 300) || undefined;
  useResetPageOnFilterChange(setPage, [orderSearch, statusFilter, pageSize, sort]);

  const { data, isLoading, isFetching, error } = useOrders(status, undefined, undefined, orderSearch, { page, pageSize, sort });
  const orders = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  const showTableSkeleton = isLoading && !data;
  const tableLoading = isFetching && !showTableSkeleton;

  const statusVariant = (s: OrderStatus) => {
    if (s === 'received') return 'success' as const;
    if (s === 'cancelled') return 'danger' as const;
    return 'warning' as const;
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        description={PAGE_DESCRIPTIONS.orders}
        action={
          isAdmin && (
            <HeaderButton onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" /> New Order
            </HeaderButton>
          )
        }
      />

      <PageCard>
        <TabBar
          active={statusFilter}
          onChange={setStatusFilter}
          tabs={ORDER_TABS.map((t) => ({ ...t, count: t.id === statusFilter ? total : undefined }))}
        />

        <TableArea loading={tableLoading}>
          {error && !data ? (
            <ErrorState message="Failed to load orders" />
          ) : showTableSkeleton ? (
            <LoadingSkeleton rows={6} />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <FilterInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Order #, customer, status, product, notes..."
                  className="w-full sm:w-72"
                />
                <SortSelect
                  value={sort}
                  onChange={(value) => setSort(value as OrderSort)}
                  defaultValue="newest"
                  className="shrink-0"
                  options={[
                    { value: 'newest', label: 'Sort: Newest' },
                    { value: 'oldest', label: 'Sort: Oldest' },
                    { value: 'customer', label: 'Sort: Customer' },
                  ]}
                />
              </div>
              <Table headers={['Order#', 'Customer', 'Items', 'Total', 'Status', 'Date', '']}>
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-4 text-sm font-medium">{formatOrderId(order.id)}</td>
                    <td className="px-4 py-4 text-sm">{order.supplier}</td>
                    <td className="px-4 py-4 text-sm">{order.items.length}</td>
                    <td className="px-4 py-4 text-sm font-medium">{formatCurrency(orderTotal(order.items))}</td>
                    <td className="px-4 py-4">
                      <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-4">
                      <Link to={`/orders/${order.id}`} className="text-sm font-medium text-brand hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {total === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No orders found</td>
                  </tr>
                )}
              </Table>
              <Pagination page={page} total={pages} onChange={setPage} totalItems={total} />
            </>
          )}
        </TableArea>
      </PageCard>

      <CreateOrderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
