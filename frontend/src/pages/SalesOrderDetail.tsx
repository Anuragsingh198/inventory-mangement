import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Badge,
  ErrorState,
  LoadingSkeleton,
  OutlineButton,
  PageCard,
  PrimaryButton,
  Table,
} from '../components';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useEnterpriseMutations, useSalesOrder } from '../hooks/useEnterprise';
import { formatCurrency, formatDate, formatOrderId } from '../lib/utils';

export function SalesOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const soId = Number(id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const { data: order, isLoading, error } = useSalesOrder(soId);
  const { fulfillSO } = useEnterpriseMutations();

  if (isLoading) return <LoadingSkeleton />;
  if (error || !order) return <ErrorState message="Sales order not found" />;

  const total = order.items.reduce((sum, line) => sum + line.quantity * Number(line.unit_price), 0);
  const statusVariant = order.status === 'fulfilled' || order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'danger' : 'warning';

  const handleFulfill = async () => {
    try {
      await fulfillSO.mutateAsync(soId);
      showToast('Order fulfilled', 'success');
    } catch {
      showToast('Failed to fulfill order', 'error');
    }
  };

  return (
    <div>
      <Link to="/sales" className="text-sm text-brand hover:underline">← Back to Sales Orders</Link>
      <PageCard>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">SO #{formatOrderId(order.id)}</h1>
            <Badge variant={statusVariant}>{order.status}</Badge>
          </div>
          {isAdmin && order.status === 'confirmed' && (
            <PrimaryButton onClick={handleFulfill}>Fulfill Order</PrimaryButton>
          )}
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-gray-400">Customer</p>
            <p className="font-medium">{order.customer?.name ?? `#${order.customer_id}`}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Created</p>
            <p className="font-medium">{formatDate(order.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Email</p>
            <p className="font-medium">{order.customer?.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total</p>
            <p className="font-medium">{formatCurrency(total)}</p>
          </div>
        </div>

        {order.notes && <p className="mb-4 text-sm text-gray-600">{order.notes}</p>}

        <Table headers={['Product', 'Ordered', 'Fulfilled', 'Unit Price', 'Line Total']}>
          {order.items.map((line) => (
            <tr key={line.id}>
              <td className="px-4 py-3 text-sm">{line.product?.name ?? `Product #${line.product_id}`}</td>
              <td className="px-4 py-3 text-sm">{line.quantity}</td>
              <td className="px-4 py-3 text-sm">{line.fulfilled_quantity}</td>
              <td className="px-4 py-3 text-sm">{formatCurrency(Number(line.unit_price))}</td>
              <td className="px-4 py-3 text-sm font-medium">{formatCurrency(line.quantity * Number(line.unit_price))}</td>
            </tr>
          ))}
        </Table>

        <div className="mt-6 flex justify-end">
          <OutlineButton onClick={() => navigate('/sales')}>Close</OutlineButton>
        </div>
      </PageCard>
    </div>
  );
}
