import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal, PageCard, PageHeader, Pagination, PrimaryButton, Table } from '../components';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useOrderMutations, useOrders } from '../hooks/useOrders';
import { usePagination } from '../hooks/usePagination';
import { formatDate, formatOrderId, PAGE_SIZE } from '../lib/utils';

export function ShipmentsPage() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number>(0);

  const { data: orders, isLoading } = useOrders('received');
  const { data: pendingOrders } = useOrders('pending');
  const { updateStatus } = useOrderMutations();

  const { page, pages, paged, setPage, total } = usePagination(orders ?? [], 'shipments');

  const handleReceive = async () => {
    if (!selectedOrderId) {
      showToast('Select an order', 'error');
      return;
    }
    try {
      await updateStatus.mutateAsync({ id: selectedOrderId, status: 'received' });
      showToast('Shipment created — order marked received', 'success');
      setModalOpen(false);
      setSelectedOrderId(0);
    } catch {
      showToast('Failed to create shipment', 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Shipments"
        action={
          isAdmin && (
            <PrimaryButton onClick={() => setModalOpen(true)}>New Shipment</PrimaryButton>
          )
        }
      />
      <PageCard>
        {isLoading ? (
          <p className="py-8 text-center text-sm text-gray-400">Loading...</p>
        ) : (
          <>
            <Table headers={['Shipment#', 'Order#', 'Customer', 'Ship Date', 'Carrier', 'Status']}>
              {paged.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-4 text-sm font-medium">SH-{formatOrderId(order.id)}</td>
                  <td className="px-4 py-4 text-sm">
                    <Link to={`/orders/${order.id}`} className="text-brand hover:underline">
                      {formatOrderId(order.id)}
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm">{order.supplier}</td>
                  <td className="px-4 py-4 text-sm text-gray-500">{formatDate(order.created_at)}</td>
                  <td className="px-4 py-4 text-sm">FedEx</td>
                  <td className="px-4 py-4 text-sm text-green-600">Delivered</td>
                </tr>
              ))}
              {total === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                    No shipments yet
                  </td>
                </tr>
              )}
            </Table>
            <Pagination page={page} total={pages} onChange={setPage} totalItems={total} perPage={PAGE_SIZE} />
          </>
        )}
      </PageCard>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Shipment">
        <p className="mb-4 text-sm text-gray-500">
          Select a pending order to mark as received and create a shipment record.
        </p>
        <select
          value={selectedOrderId}
          onChange={(e) => setSelectedOrderId(Number(e.target.value))}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value={0}>Select pending order</option>
          {pendingOrders?.map((order) => (
            <option key={order.id} value={order.id}>
              {formatOrderId(order.id)} — {order.supplier}
            </option>
          ))}
        </select>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm">
            Cancel
          </button>
          <PrimaryButton onClick={handleReceive}>Create Shipment</PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}
