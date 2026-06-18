import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { ErrorState, LoadingSkeleton, PageCard, Table } from '../components';
import { useSupplier, useSupplierPayments } from '../hooks/useEnterprise';
import { formatCurrency, formatDate } from '../lib/utils';

export function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supplierId = Number(id);
  const { data: supplier, isLoading, error } = useSupplier(supplierId);
  const { data: payments } = useSupplierPayments(supplierId);

  if (isLoading) return <LoadingSkeleton />;
  if (error || !supplier) return <ErrorState message="Supplier not found" />;

  return (
    <div>
      <Link to="/suppliers" className="text-sm text-brand hover:underline">← Back to Suppliers</Link>
      <PageCard>
        <h1 className="mb-6 text-xl font-bold">{supplier.name}</h1>
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-gray-400">Contact</p>
            <p className="font-medium">{supplier.contact_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Email</p>
            <p className="font-medium">{supplier.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Phone</p>
            <p className="font-medium">{supplier.phone ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Payment Terms</p>
            <p className="font-medium">{supplier.payment_terms ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Rating</p>
            <p className="font-medium">{supplier.rating ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Added</p>
            <p className="font-medium">{formatDate(supplier.created_at)}</p>
          </div>
        </div>
        {supplier.address && <p className="mb-4 text-sm text-gray-600">{supplier.address}</p>}
        {supplier.notes && <p className="mb-6 text-sm text-gray-500">{supplier.notes}</p>}

        <h2 className="mb-3 text-sm font-semibold text-gray-700">Payment History</h2>
        <Table headers={['Amount', 'Reference', 'Paid At', 'Notes']}>
          {(payments ?? []).length === 0 ? (
            <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">No payments recorded</td></tr>
          ) : (
            (payments as { id: number; amount: number; reference: string | null; paid_at: string | null; notes: string | null }[]).map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 text-sm">{formatCurrency(Number(p.amount))}</td>
                <td className="px-4 py-3 text-sm">{p.reference ?? '—'}</td>
                <td className="px-4 py-3 text-sm">{p.paid_at ? formatDate(p.paid_at) : 'Outstanding'}</td>
                <td className="px-4 py-3 text-sm">{p.notes ?? '—'}</td>
              </tr>
            ))
          )}
        </Table>
      </PageCard>
    </div>
  );
}
