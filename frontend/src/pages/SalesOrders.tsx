import { Link } from 'react-router-dom';
import { Badge, ErrorState, LoadingSkeleton, PageCard, PageHeader, Table } from '../components';
import { useAuth } from '../context/AuthContext';
import { useEnterpriseMutations, useSalesOrders } from '../hooks/useEnterprise';
import { formatDate, formatOrderId } from '../lib/utils';

export function SalesOrdersPage() {
  const { data, isLoading, error } = useSalesOrders();
  const { fulfillSO } = useEnterpriseMutations();
  const { isAdmin } = useAuth();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message="Failed to load sales orders" />;

  return (
    <div>
      <PageHeader title="Sales Orders" />
      <PageCard>
        <Table headers={['SO #', 'Customer', 'Status', 'Items', 'Created', 'Actions']}>
          {(data ?? []).map((so) => (
            <tr key={so.id} className="hover:bg-gray-50/50">
              <td className="px-4 py-4 text-sm font-medium">#{formatOrderId(so.id)}</td>
              <td className="px-4 py-4 text-sm">{so.customer?.name ?? so.customer_id}</td>
              <td className="px-4 py-4"><Badge variant={so.status === 'fulfilled' ? 'success' : 'warning'}>{so.status}</Badge></td>
              <td className="px-4 py-4 text-sm">{so.items.length}</td>
              <td className="px-4 py-4 text-sm text-gray-500">{formatDate(so.created_at)}</td>
              <td className="px-4 py-4 text-sm">
                <Link to={`/sales/${so.id}`} className="mr-3 text-brand hover:underline">View</Link>
                {isAdmin && so.status === 'confirmed' && (
                  <button type="button" className="text-brand hover:underline" onClick={() => fulfillSO.mutate(so.id)}>Fulfill</button>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </PageCard>
    </div>
  );
}
