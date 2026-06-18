import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import {
  Badge,
  ErrorState,
  FilterInput,
  LoadingSkeleton,
  PageCard,
  PageHeader,
  Pagination,
  PrimaryButton,
  TabBar,
  Table,
} from '../components';
import { CreateOrderModal } from '../components/CreateOrderModal';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../hooks/useOrders';
import { usePagination } from '../hooks/usePagination';
import { formatCurrency, formatDate, formatOrderId, orderTotal, PAGE_SIZE } from '../lib/utils';
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
  const [modalOpen, setModalOpen] = useState(false);

  const status = statusFilter === 'all' ? undefined : (statusFilter as OrderStatus);
  const { data: orders, isLoading, error } = useOrders(status);

  const filtered = (orders ?? []).filter(
    (o) =>
      o.supplier.toLowerCase().includes(search.toLowerCase()) ||
      formatOrderId(o.id).includes(search),
  );
  const { page, pages, paged, setPage, total } = usePagination(filtered, `${search}-${statusFilter}`);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message="Failed to load orders" />;

  const statusVariant = (s: OrderStatus) => {
    if (s === 'received') return 'success' as const;
    if (s === 'cancelled') return 'danger' as const;
    return 'warning' as const;
  };

  return (
    <div>
      <PageHeader
        title="Orders"
        action={
          isAdmin && (
            <PrimaryButton onClick={() => setModalOpen(true)}>
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> New Order
              </span>
            </PrimaryButton>
          )
        }
      />

      <PageCard>
        <TabBar
          active={statusFilter}
          onChange={setStatusFilter}
          tabs={ORDER_TABS.map((t) => ({ ...t, count: t.id === statusFilter ? total : undefined }))}
        />

        <Table
          headers={['Order#', 'Customer', 'Items', 'Total', 'Status', 'Date', '']}
          filterRow={
            <td colSpan={7} className="px-3 py-2">
              <FilterInput value={search} onChange={setSearch} placeholder="Filter orders..." />
            </td>
          }
        >
          {paged.map((order) => (
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
        </Table>
        <Pagination page={page} total={pages} onChange={setPage} totalItems={total} perPage={PAGE_SIZE} />
      </PageCard>

      <CreateOrderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
