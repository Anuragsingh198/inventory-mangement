import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { OrderSort } from '../api/orders';
import { FilterInput, Modal, PageCard, PageHeader, Pagination, HeaderButton, PrimaryButton, SortSelect, Table, TableArea } from '../components';
import { useAuth } from '../context/AuthContext';
import { usePageSize } from '../context/PageSizeContext';
import { useToast } from '../context/ToastContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useOrderMutations, useOrders } from '../hooks/useOrders';
import { useResetPageOnFilterChange } from '../hooks/useResetPageOnFilterChange';
import { PAGE_DESCRIPTIONS } from '../lib/pageMeta';
import { getApiErrorMessage } from '../lib/apiError';
import { formatDate, formatOrderId } from '../lib/utils';

export function ShipmentsPage() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number>(0);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<OrderSort>('newest');
  const { pageSize } = usePageSize();
  const [page, setPage] = useState(1);

  const orderSearch = useDebouncedValue(search.trim(), 300) || undefined;
  useResetPageOnFilterChange(setPage, [orderSearch, pageSize, sort]);

  const { data, isLoading, isFetching } = useOrders('received', undefined, undefined, orderSearch, { page, pageSize, sort });
  const { data: pendingData } = useOrders('pending', undefined, undefined, undefined, { all: true });
  const { updateStatus } = useOrderMutations();

  const orders = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const pendingOrders = pendingData?.items ?? [];
  const tableLoading = isFetching && !isLoading;

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
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to create shipment'), 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Shipments"
        description={PAGE_DESCRIPTIONS.shipments}
        action={
          isAdmin && (
            <HeaderButton onClick={() => setModalOpen(true)}>New Shipment</HeaderButton>
          )
        }
      />
      <PageCard>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <FilterInput
            value={search}
            onChange={setSearch}
            placeholder="Order #, customer, status..."
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
        {isLoading && !data ? (
          <p className="py-8 text-center text-sm text-gray-400">Loading...</p>
        ) : (
          <TableArea loading={tableLoading}>
            <Table headers={['Shipment#', 'Order#', 'Customer', 'Ship Date', 'Carrier', 'Status']}>
              {orders.map((order) => (
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
            <Pagination page={page} total={pages} onChange={setPage} totalItems={total} />
          </TableArea>
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
          {pendingOrders.map((order) => (
            <option key={order.id} value={order.id}>
              {formatOrderId(order.id)} — {order.supplier}
            </option>
          ))}
        </select>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm">
            Cancel
          </button>
          <PrimaryButton loading={updateStatus.isPending} onClick={handleReceive}>Create Shipment</PrimaryButton>
        </div>
      </Modal>
    </div>
  );
}
