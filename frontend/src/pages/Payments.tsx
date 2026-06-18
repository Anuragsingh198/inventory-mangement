import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ErrorState,
  LoadingSkeleton,
  Modal,
  PageCard,
  PageHeader,
  Pagination,
  PrimaryButton,
  RowActions,
  TabBar,
  Table,
} from '../components';
import { CreateOrderModal } from '../components/CreateOrderModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useOrderMutations, useOrders } from '../hooks/useOrders';
import { usePagination } from '../hooks/usePagination';
import { getOrderFavorites, isOrderFavorite, toggleOrderFavorite } from '../lib/favorites';
import { formatCurrency, formatDate, formatOrderId, orderTotal, PAGE_SIZE, paymentStatus } from '../lib/utils';

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
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => getOrderFavorites());

  const status = activeTab === 'all' ? undefined : activeTab;
  const { data: orders, isLoading, error } = useOrders(status);
  const { remove } = useOrderMutations();

  const { page, pages, paged, setPage, total } = usePagination(orders ?? [], activeTab);

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

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message="Failed to load payments" />;

  return (
    <div>
      <PageHeader
        title="Payments"
        action={
          isAdmin && (
            <PrimaryButton onClick={() => setModalOpen(true)}>New Payment</PrimaryButton>
          )
        }
      />

      <PageCard>
        <TabBar
          active={activeTab}
          onChange={setActiveTab}
          tabs={PAYMENT_TABS.map((t) => ({ ...t, count: t.id === activeTab ? total : undefined }))}
        />

        <Table headers={['Order#', 'Customer Name', 'Date', 'Status', 'Total amount', 'Actions']}>
          {paged.map((order) => (
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

        <Pagination page={page} total={pages} onChange={setPage} totalItems={total} perPage={PAGE_SIZE} />
      </PageCard>

      <CreateOrderModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      <Modal isOpen={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Payment">
        <p className="text-sm text-gray-600">Delete this order and its payment record?</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setDeleteId(null)} className="rounded-lg border px-4 py-2 text-sm">
            Cancel
          </button>
          <button type="button" onClick={handleDelete} className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white">
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
