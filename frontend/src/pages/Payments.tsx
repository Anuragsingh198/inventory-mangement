import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { OrderSort } from '../api/orders';
import {
  DangerButton,
  ErrorState,
  FilterInput,
  LoadingSkeleton,
  Modal,
  PageCard,
  PageHeader,
  Pagination,
  HeaderButton,
  RowActions,
  SortSelect,
  TabBar,
  Table,
  TableArea,
} from '../components';
import { CreateOrderModal } from '../components/CreateOrderModal';
import { useAuth } from '../context/AuthContext';
import { usePageSize } from '../context/PageSizeContext';
import { useToast } from '../context/ToastContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useOrderMutations, useOrders } from '../hooks/useOrders';
import { useResetPageOnFilterChange } from '../hooks/useResetPageOnFilterChange';
import { PAGE_DESCRIPTIONS } from '../lib/pageMeta';
import { getOrderFavorites, isOrderFavorite, toggleOrderFavorite } from '../lib/favorites';
import { formatCurrency, formatDate, formatOrderId, orderTotal, paymentStatus } from '../lib/utils';

type PaymentTab = 'all' | 'pending' | 'received' | 'cancelled';

const PAYMENT_TABS: { id: PaymentTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Submitted' },
  { id: 'received', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export function PaymentsPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<PaymentTab>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<OrderSort>('newest');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => getOrderFavorites());

  const { pageSize } = usePageSize();
  const status = activeTab === 'all' ? undefined : activeTab;
  const orderSearch = useDebouncedValue(search.trim(), 300) || undefined;
  useResetPageOnFilterChange(setPage, [activeTab, pageSize, orderSearch, sort]);
  const { data, isLoading, isFetching, error } = useOrders(status, undefined, undefined, orderSearch, { page, pageSize, sort });
  const { remove } = useOrderMutations();

  const orders = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const tableLoading = isFetching && !isLoading;

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove.mutateAsync(deleteId);
      showToast('Payment deleted', 'success');
      setDeleteId(null);
    } catch {
      showToast('Failed to delete payment', 'error');
    }
  };

  const handleStar = (orderId: number) => {
    const starred = toggleOrderFavorite(orderId);
    setFavoriteIds(getOrderFavorites());
    showToast(starred ? 'Payment starred' : 'Star removed', 'success');
  };

  if (isLoading && !data) return <LoadingSkeleton />;
  if (error && !data) return <ErrorState message="Failed to load payments" />;

  return (
    <div>
      <PageHeader
        title="Payments"
        description={PAGE_DESCRIPTIONS.payments}
        action={
          isAdmin && (
            <HeaderButton onClick={() => setModalOpen(true)}>New Payment</HeaderButton>
          )
        }
      />

      <PageCard>
        <TabBar
          active={activeTab}
          onChange={setActiveTab}
          tabs={PAYMENT_TABS.map((t) => ({ ...t, count: t.id === activeTab ? total : undefined }))}
        />

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <FilterInput
            value={search}
            onChange={setSearch}
            placeholder="Order #, customer, status, product..."
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

        <TableArea loading={tableLoading}>
          <Table headers={['Order#', 'Customer Name', 'Date', 'Status', 'Total amount', 'Actions']}>
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-4 text-sm font-medium">
                  <Link to={`/orders/${order.id}`} className="text-brand hover:underline">
                    {formatOrderId(order.id)}
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm">{order.supplier}</td>
                <td className="px-4 py-4 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                <td className="px-4 py-4 text-sm">{paymentStatus(order.status)}</td>
                <td className="px-4 py-4 text-sm font-medium">{formatCurrency(orderTotal(order.items))}</td>
                <td className="px-4 py-4">
                  {isAdmin && (
                    <RowActions
                      onEdit={() => navigate(`/orders/${order.id}`)}
                      onDelete={() => setDeleteId(order.id)}
                      onStar={() => handleStar(order.id)}
                      starred={isOrderFavorite(order.id) || favoriteIds.includes(order.id)}
                    />
                  )}
                </td>
              </tr>
            ))}
            {total === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                  No payments found
                </td>
              </tr>
            )}
          </Table>

          <Pagination page={page} total={pages} onChange={setPage} totalItems={total} />
        </TableArea>
      </PageCard>

      <CreateOrderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Payment">
        <p className="text-sm text-gray-600">Delete this order and its payment record?</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setDeleteId(null)} className="rounded-lg border px-4 py-2 text-sm">
            Cancel
          </button>
          <DangerButton loading={remove.isPending} onClick={handleDelete}>Delete</DangerButton>
        </div>
      </Modal>
    </div>
  );
}
