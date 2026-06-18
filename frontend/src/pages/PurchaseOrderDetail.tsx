import { useNavigate, useParams } from 'react-router-dom';
import {
  Badge,
  ErrorState,
  LoadingSkeleton,
  HeaderButton,
  OutlineButton,
  PageCard,
  PageHeader,
  Table,
} from '../components';
import { useAuth } from '../context/AuthContext';
import { useEnterpriseMutations, usePurchaseOrder } from '../hooks/useEnterprise';
import {
  canApprovePO,
  canApprovePurchaseOrder,
  canReceivePO,
  canReceivePurchaseOrder,
} from '../types';
import { PAGE_DESCRIPTIONS } from '../lib/pageMeta';
import { formatCurrency, formatDate, formatOrderId } from '../lib/utils';

export function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const poId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role;
  const { data: po, isLoading, error } = usePurchaseOrder(poId);
  const { approvePO, receivePO } = useEnterpriseMutations();

  if (isLoading) return <LoadingSkeleton />;
  if (error || !po) return <ErrorState message="Purchase order not found" />;

  const total = po.items.reduce((sum, line) => sum + line.quantity * Number(line.unit_price), 0);
  const statusVariant = po.status === 'received' ? 'success' : po.status === 'cancelled' ? 'danger' : 'warning';
  const showApprove = canApprovePO(role) && canApprovePurchaseOrder(po);
  const showReceive = canReceivePO(role) && canReceivePurchaseOrder(po);

  return (
    <div>
      <PageHeader
        title={`PO #${formatOrderId(po.id)}`}
        description={PAGE_DESCRIPTIONS.purchaseOrderDetail}
        showDate={false}
        backTo={{ label: 'Back to Purchase Orders', path: '/purchases' }}
        action={
          <>
            <Badge variant={statusVariant}>{po.status.replace(/_/g, ' ')}</Badge>
            {showApprove && (
              <HeaderButton loading={approvePO.isPending} disabled={receivePO.isPending} onClick={() => approvePO.mutate(poId)}>
                Approve
              </HeaderButton>
            )}
            {showReceive && (
              <HeaderButton loading={receivePO.isPending} disabled={approvePO.isPending} onClick={() => receivePO.mutate(poId)}>
                Receive Stock
              </HeaderButton>
            )}
          </>
        }
      />
      <PageCard>
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
