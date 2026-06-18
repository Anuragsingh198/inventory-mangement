import { Link } from 'react-router-dom';
import { ErrorState, LoadingSkeleton, PageCard, PageHeader, Table } from '../components';
import { useWarehouses } from '../hooks/useEnterprise';

export function WarehousesPage() {
  const { data, isLoading, error } = useWarehouses();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message="Failed to load warehouses" />;

  return (
    <div>
      <PageHeader title="Warehouses" />
      <PageCard>
        <Table headers={['Code', 'Name', 'Address', 'Status', '']}>
          {(data ?? []).map((w) => (
            <tr key={w.id} className="hover:bg-gray-50/50">
              <td className="px-4 py-4 text-sm font-medium">{w.code}</td>
              <td className="px-4 py-4 text-sm">{w.name}</td>
              <td className="px-4 py-4 text-sm">{w.address ?? '—'}</td>
              <td className="px-4 py-4 text-sm">{w.is_active ? 'Active' : 'Inactive'}</td>
              <td className="px-4 py-4 text-sm">
                <Link to={`/warehouses/${w.id}`} className="text-brand hover:underline">View</Link>
              </td>
            </tr>
          ))}
        </Table>
      </PageCard>
    </div>
  );
}
