import { Link } from 'react-router-dom';
import { ErrorState, LoadingSkeleton, PageCard, PageHeader, Table } from '../components';
import { useSuppliers } from '../hooks/useEnterprise';
import { formatDate } from '../lib/utils';

export function SuppliersPage() {
  const { data, isLoading, error } = useSuppliers();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message="Failed to load suppliers" />;

  return (
    <div>
      <PageHeader title="Suppliers" />
      <PageCard>
        <Table headers={['Name', 'Contact', 'Email', 'Phone', 'Rating', 'Added', '']}>
          {(data ?? []).map((s) => (
            <tr key={s.id} className="hover:bg-gray-50/50">
              <td className="px-4 py-4 text-sm font-medium">{s.name}</td>
              <td className="px-4 py-4 text-sm">{s.contact_name ?? '—'}</td>
              <td className="px-4 py-4 text-sm">{s.email ?? '—'}</td>
              <td className="px-4 py-4 text-sm">{s.phone ?? '—'}</td>
              <td className="px-4 py-4 text-sm">{s.rating ?? '—'}</td>
              <td className="px-4 py-4 text-sm text-gray-500">{formatDate(s.created_at)}</td>
              <td className="px-4 py-4 text-sm">
                <Link to={`/suppliers/${s.id}`} className="text-brand hover:underline">View</Link>
              </td>
            </tr>
          ))}
        </Table>
      </PageCard>
    </div>
  );
}
