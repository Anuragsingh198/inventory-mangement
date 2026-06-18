import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, Trash2 } from 'lucide-react';
import {
  Badge,
  DangerButton,
  ErrorState,
  LoadingSkeleton,
  HeaderOutlineButton,
  OutlineButton,
  PageCard,
  PageHeader,
  PrimaryButton,
  Pagination,
  Table,
} from '../components';
import { useAuth } from '../context/AuthContext';
import { usePageSize } from '../context/PageSizeContext';
import { useToast } from '../context/ToastContext';
import { useOrder } from '../hooks/useOrder';
import { useOrderMutations } from '../hooks/useOrders';
import { usePagination } from '../hooks/usePagination';
import { downloadCsv, printHtml } from '../lib/export';
import { PAGE_DESCRIPTIONS } from '../lib/pageMeta';
import { formatCurrency, formatDate, formatOrderId, orderTotal } from '../lib/utils';
import type { OrderStatus } from '../types';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = Number(id);
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const { data: order, isLoading, error } = useOrder(orderId);
  const { updateStatus, update } = useOrderMutations();
  const [notes, setNotes] = useState('');
  const { pageSize } = usePageSize();
  const { page, pages, paged, setPage, total: itemCount } = usePagination(order?.items ?? [], `order-${orderId}`, pageSize);

  useEffect(() => {
    if (order?.notes) setNotes(order.notes);
  }, [order?.notes]);

  if (isLoading) return <LoadingSkeleton />;
  if (error || !order) return <ErrorState message="Order not found" />;

  const subtotal = orderTotal(order.items);
  const tax = subtotal * 0.2;
  const total = subtotal + tax;

  const statusUpdating = updateStatus.isPending ? updateStatus.variables?.status : undefined;

  const handleStatus = async (status: OrderStatus) => {
    try {
      await updateStatus.mutateAsync({ id: order.id, status });
      showToast(`Order marked as ${status}`, 'success');
      if (status === 'cancelled') navigate('/orders');
    } catch {
      showToast('Failed to update order', 'error');
    }
  };

  const handleSave = async () => {
    try {
      await update.mutateAsync({ id: order.id, data: { notes } });
      showToast('Order saved', 'success');
    } catch {
      showToast('Failed to save order', 'error');
    }
  };

  const exportRows = order.items.map((item) => [
    item.product?.name ?? `Product #${item.product_id}`,
    String(item.quantity),
    String(item.unit_price),
    String(item.quantity * Number(item.unit_price)),
    '20%',
  ]);

  const handleExcel = () => {
    downloadCsv(
      `order-${formatOrderId(order.id)}.csv`,
      ['Item', 'Quantity', 'Unit Price', 'Total', 'Tax %'],
      exportRows,
    );
    showToast('Excel export downloaded', 'success');
  };

  const handlePdf = () => {
    const rows = order.items
      .map(
        (item) =>
          `<tr><td>${item.product?.name ?? ''}</td><td>${item.quantity}</td><td>${formatCurrency(Number(item.unit_price))}</td><td>${formatCurrency(item.quantity * Number(item.unit_price))}</td></tr>`,
      )
      .join('');
    printHtml(
      `Order ${formatOrderId(order.id)}`,
      `<h1>Sales Order ${formatOrderId(order.id)}</h1><p>Customer: ${order.supplier}</p>
      <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
      <p><strong>Total: ${formatCurrency(total)}</strong></p>`,
    );
  };

  const handlePrint = () => handlePdf();

  const copyLine = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard', 'success');
  };

  const statusLabel = order.status === 'received' ? 'Paid' : order.status === 'pending' ? 'Pending' : 'Cancelled';
  const statusVariant = order.status === 'received' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning';

  return (
    <div>
      <PageHeader
        title={`Order ${formatOrderId(order.id)} — ${order.supplier}`}
        description={PAGE_DESCRIPTIONS.orderDetail}
        showDate={false}
        backTo={{ label: 'Back to Orders', path: '/orders' }}
        action={
          <>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
            <HeaderOutlineButton onClick={handleExcel}>Excel</HeaderOutlineButton>
            <HeaderOutlineButton onClick={handlePdf}>PDF</HeaderOutlineButton>
            <HeaderOutlineButton onClick={handlePrint}>Print</HeaderOutlineButton>
          </>
        }
      />

      <PageCard>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs text-gray-400">Customer Name</label>
            <input
              readOnly
              value={order.supplier}
              className="mt-1 w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Delivery deadline</label>
            <input
              readOnly
              value={formatDate(order.created_at)}
              className="mt-1 w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Sales Order#</label>
            <input
              readOnly
              value={formatOrderId(order.id)}
              className="mt-1 w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400">Create date</label>
            <input
              readOnly
              value={formatDate(order.created_at)}
              className="mt-1 w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <Table headers={['Item', 'Quantity', 'Price per unit', 'Total', 'Tax %', 'Availability', 'Production', 'Action']}>
          {paged.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 text-sm">{item.product?.name ?? `Product #${item.product_id}`}</td>
              <td className="px-4 py-3 text-sm">{item.quantity} pcs</td>
              <td className="px-4 py-3 text-sm">{formatCurrency(Number(item.unit_price))}</td>
              <td className="px-4 py-3 text-sm font-medium">
                {formatCurrency(item.quantity * Number(item.unit_price))}
              </td>
              <td className="px-4 py-3 text-sm">20%</td>
              <td className="px-4 py-3 text-sm text-gray-500">Expected</td>
              <td className="px-4 py-3 text-sm text-gray-500">Not started</td>
              <td className="px-4 py-3">
                <div className="flex gap-2 text-gray-400">
                  <button
                    type="button"
                    onClick={() =>
                      copyLine(
                        `${item.product?.name ?? ''}\t${item.quantity}\t${item.unit_price}`,
                      )
                    }
                    className="hover:text-gray-600"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Line items cannot be removed after order creation', 'error')}
                    className="hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>

        <Pagination page={page} total={pages} onChange={setPage} totalItems={itemCount} />

        <div className="mt-6 flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal (Tax excluded)</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Tax</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium text-gray-700">Additional info</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Type comment here"
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            rows={3}
            readOnly={!isAdmin}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <OutlineButton onClick={() => navigate('/orders')}>Cancel</OutlineButton>
          {isAdmin && order.status === 'pending' && (
            <>
              <PrimaryButton
                loading={statusUpdating === 'received'}
                disabled={updateStatus.isPending || update.isPending}
                onClick={() => handleStatus('received')}
              >
                Mark Received
              </PrimaryButton>
              <DangerButton
                loading={statusUpdating === 'cancelled'}
                disabled={updateStatus.isPending || update.isPending}
                onClick={() => handleStatus('cancelled')}
              >
                Cancel Order
              </DangerButton>
            </>
          )}
          {isAdmin && (
            <PrimaryButton loading={update.isPending} disabled={updateStatus.isPending} onClick={handleSave}>
              Save
            </PrimaryButton>
          )}
        </div>
      </PageCard>
    </div>
  );
}
