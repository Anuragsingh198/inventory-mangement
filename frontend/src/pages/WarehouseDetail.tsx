import { useParams } from 'react-router-dom';
import { Badge, ErrorState, LoadingSkeleton, PageCard, PageHeader, Table } from '../components';
import { useWarehouse, useWarehouseLocations } from '../hooks/useEnterprise';
import { PAGE_DESCRIPTIONS } from '../lib/pageMeta';
import { formatDate } from '../lib/utils';

export function WarehouseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const warehouseId = Number(id);
  const { data: warehouse, isLoading, error } = useWarehouse(warehouseId);
  const { data: locations } = useWarehouseLocations(warehouseId);

  if (isLoading) return <LoadingSkeleton />;
  if (error || !warehouse) return <ErrorState message="Warehouse not found" />;

  return (
    <div>
      <PageHeader
        title={warehouse.name}
        description={PAGE_DESCRIPTIONS.warehouseDetail}
        showDate={false}
        backTo={{ label: 'Back to Warehouses', path: '/warehouses' }}
        action={<Badge variant={warehouse.is_active ? 'success' : 'danger'}>{warehouse.is_active ? 'Active' : 'Inactive'}</Badge>}
      />
      <PageCard>
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-gray-400">Code</p>
            <p className="font-medium">{warehouse.code}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Address</p>
            <p className="font-medium">{warehouse.address ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Created</p>
            <p className="font-medium">{formatDate(warehouse.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Locations</p>
            <p className="font-medium">{(locations ?? []).length}</p>
          </div>
        </div>

        <h2 className="mb-3 text-sm font-semibold text-gray-700">Rack / Shelf / Bin Locations</h2>
        <Table headers={['Label', 'Rack', 'Shelf', 'Bin']}>
          {(locations ?? []).length === 0 ? (
            <tr><td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">No locations configured</td></tr>
          ) : (
            (locations as { id: number; label: string; rack: string | null; shelf: string | null; bin: string | null }[]).map((loc) => (
              <tr key={loc.id}>
                <td className="px-4 py-3 text-sm font-medium">{loc.label}</td>
                <td className="px-4 py-3 text-sm">{loc.rack ?? '—'}</td>
                <td className="px-4 py-3 text-sm">{loc.shelf ?? '—'}</td>
                <td className="px-4 py-3 text-sm">{loc.bin ?? '—'}</td>
              </tr>
            ))
          )}
        </Table>
      </PageCard>
    </div>
  );
}
