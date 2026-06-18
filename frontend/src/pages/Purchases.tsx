import { Link } from 'react-router-dom';
import { Badge, ErrorState, LoadingSkeleton, PageCard, PageHeader, Table } from '../components';
import { useAuth } from '../context/AuthContext';
import { useEnterpriseMutations, usePurchaseOrders } from '../hooks/useEnterprise';
import { formatDate, formatOrderId } from '../lib/utils';

export function PurchasesPage() {
  const { data, isLoading, error } = usePurchaseOrders();
  const { approvePO, receivePO } = useEnterpriseMutations();
  const { isAdmin } = useAuth();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message="Failed to load purchase orders" />;

  return (
    <div>
      <PageHeader title="Purchase Orders" />
      <PageCard>
        <Table headers={['PO #', 'Supplier', 'Status', 'Items', 'Created', 'Actions']}>
          {(data ?? []).map((po) => (
            <tr key={po.id} className="hover:bg-gray-50/50">
              <td className="px-4 py-4 text-sm font-medium">#{formatOrderId(po.id)}</td>
              <td className="px-4 py-4 text-sm">{po.supplier?.name ?? po.supplier_id}</td>
              <td className="px-4 py-4"><Badge variant={po.status === 'received' ? 'success' : 'warning'}>{po.status.replace(/_/g, ' ')}</Badge></td>
              <td className="px-4 py-4 text-sm">{po.items.length}</td>
              <td className="px-4 py-4 text-sm text-gray-500">{formatDate(po.created_at)}</td>
              <td className="px-4 py-4 text-sm">
                <Link to={`/purchases/${po.id}`} className="mr-3 text-brand hover:underline">View</Link>
                {isAdmin && po.status === 'pending_approval' && (
                  <button type="button" className="text-brand hover:underline" onClick={() => approvePO.mutate(po.id)}>Approve</button>
                )}
                {isAdmin && (po.status === 'approved' || po.status === 'partially_received') && (
                  <button type="button" className="ml-2 text-brand hover:underline" onClick={() => receivePO.mutate(po.id)}>Receive</button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </PageCard>
    </div>
  );
}
