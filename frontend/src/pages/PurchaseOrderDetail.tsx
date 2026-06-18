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
import { useEnterpriseMutations, usePurchaseOrder } from '../hooks/useEnterprise';
import { formatCurrency, formatDate, formatOrderId } from '../lib/utils';

export function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const poId = Number(id);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const { data: po, isLoading, error } = usePurchaseOrder(poId);
  const { approvePO, receivePO } = useEnterpriseMutations();

  if (isLoading) return <LoadingSkeleton />;
  if (error || !po) return <ErrorState message="Purchase order not found" />;

  const total = po.items.reduce((sum, line) => sum + line.quantity * Number(line.unit_price), 0);
  const statusVariant = po.status === 'received' ? 'success' : po.status === 'cancelled' ? 'danger' : 'warning';

  const handleApprove = async () => {
    try {
      await approvePO.mutateAsync(poId);
      showToast('Purchase order approved', 'success');
    } catch {
      showToast('Failed to approve', 'error');
    }
  };

  const handleReceive = async () => {
    try {
      await receivePO.mutateAsync(poId);
      showToast('Inventory received', 'success');
    } catch {
      showToast('Failed to receive', 'error');
    }
  };

  return (
    <div>
      <Link to="/purchases" className="text-sm text-brand hover:underline">← Back to Purchase Orders</Link>
      <PageCard>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">PO #{formatOrderId(po.id)}</h1>
            <Badge variant={statusVariant}>{po.status.replace(/_/g, ' ')}</Badge>
          </div>
          {isAdmin && (
            <div className="flex gap-2">
              {po.status === 'pending_approval' && <PrimaryButton onClick={handleApprove}>Approve</PrimaryButton>}
              {(po.status === 'approved' || po.status === 'partially_received') && (
                <PrimaryButton onClick={handleReceive}>Receive Stock</PrimaryButton>
              )}
            </div>
          )}
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-gray-400">Supplier</p>
            <p className="font-medium">{po.supplier?.name ?? `#${po.supplier_id}`}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Created</p>
            <p className="font-medium">{formatDate(po.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Warehouse</p>
            <p className="font-medium">{po.warehouse_id ? `#${po.warehouse_id}` : 'Default'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Total</p>
            <p className="font-medium">{formatCurrency(total)}</p>
          </div>
        </div>

        {po.notes && <p className="mb-4 text-sm text-gray-600">{po.notes}</p>}

        <Table headers={['Product', 'Ordered', 'Received', 'Unit Price', 'Line Total']}>
          {po.items.map((line) => (
            <tr key={line.id}>
              <td className="px-4 py-3 text-sm">{line.product?.name ?? `Product #${line.product_id}`}</td>
              <td className="px-4 py-3 text-sm">{line.quantity}</td>
              <td className="px-4 py-3 text-sm">{line.received_quantity}</td>
              <td className="px-4 py-3 text-sm">{formatCurrency(Number(line.unit_price))}</td>
              <td className="px-4 py-3 text-sm font-medium">{formatCurrency(line.quantity * Number(line.unit_price))}</td>
            </tr>
          ))}
        </Table>

        <div className="mt-6 flex justify-end">
          <OutlineButton onClick={() => navigate('/purchases')}>Close</OutlineButton>
        </div>
      </PageCard>
    </div>
  );
}
