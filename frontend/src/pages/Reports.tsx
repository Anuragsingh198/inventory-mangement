import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { exportInventory, getReportSummary } from '../api/reports';
import {
  ErrorState,
  LoadingSkeleton,
  PageCard,
  PageHeader,
  Pagination,
  PrimaryButton,
  StatCard,
  TabBar,
  Table,
} from '../components';
import { useToast } from '../context/ToastContext';
import { useInventory } from '../hooks/useInventory';
import { useOrders } from '../hooks/useOrders';
import { usePagination } from '../hooks/usePagination';
import { PAGE_SIZE } from '../lib/utils';

type ReportTab = 'orders' | 'inventory';

export function ReportsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ReportTab>('orders');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: getReportSummary,
  });
  const { data: inventory } = useInventory();
  const { data: filteredOrders } = useOrders(undefined, startDate || undefined, endDate || undefined);

  const ordersPagination = usePagination(filteredOrders ?? [], `${startDate}-${endDate}`);
  const inventoryPagination = usePagination(inventory ?? [], 'inventory');

  const handleExport = async () => {
    try {
      const blob = await exportInventory();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inventory_export.csv';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Export downloaded', 'success');
    } catch {
      showToast('Export failed', 'error');
    }
  };

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (error) return <ErrorState message="Failed to load reports" />;
  if (!summary) return null;

  return (
    <div>
      <PageHeader
        title="Reports"
        action={
          <PrimaryButton onClick={handleExport}>
            <span className="flex items-center gap-2"><Download className="h-4 w-4" /> Export CSV</span>
          </PrimaryButton>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Products" value={summary.total_products} icon={<span className="text-lg">📦</span>} accent="navy" />
        <StatCard title="Stock Value" value={`$${Number(summary.total_stock_value).toLocaleString()}`} icon={<span className="text-lg">💰</span>} accent="mint" />
        <StatCard title="Pending Orders" value={summary.pending_orders} icon={<span className="text-lg">🛒</span>} accent="blue" />
        <StatCard title="Low Stock" value={summary.low_stock_count} icon={<span className="text-lg">⚠️</span>} accent="amber" />
      </div>

      <PageCard>
        <TabBar
          active={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'orders', label: 'Orders Report', count: filteredOrders?.length },
            { id: 'inventory', label: 'Inventory Overview', count: inventory?.length },
          ]}
        />

        {activeTab === 'orders' && (
          <>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div>
                <label className="mb-1 block text-xs text-gray-500">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                />
              </div>
            </div>
            <Table headers={['ID', 'Supplier', 'Status', 'Items', 'Date']}>
              {ordersPagination.paged.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 text-sm">#{order.id}</td>
                  <td className="px-4 py-3 text-sm">{order.supplier}</td>
                  <td className="px-4 py-3 text-sm capitalize">{order.status}</td>
                  <td className="px-4 py-3 text-sm">{order.items.length}</td>
                  <td className="px-4 py-3 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {ordersPagination.total === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No orders found</td>
                </tr>
              )}
            </Table>
            <Pagination
              page={ordersPagination.page}
              total={ordersPagination.pages}
              onChange={ordersPagination.setPage}
              totalItems={ordersPagination.total}
              perPage={PAGE_SIZE}
            />
          </>
        )}

        {activeTab === 'inventory' && (
          <>
            <Table headers={['Product', 'SKU', 'Quantity', 'Threshold', 'Location', 'Value']}>
              {inventoryPagination.paged.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm">{item.product?.name}</td>
                  <td className="px-4 py-3 text-sm"><code className="text-xs">{item.product?.sku}</code></td>
                  <td className="px-4 py-3 text-sm">{item.quantity}</td>
                  <td className="px-4 py-3 text-sm">{item.min_threshold}</td>
                  <td className="px-4 py-3 text-sm">{item.location ?? '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    ${((item.product?.price ?? 0) * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </Table>
            <Pagination
              page={inventoryPagination.page}
              total={inventoryPagination.pages}
              onChange={inventoryPagination.setPage}
              totalItems={inventoryPagination.total}
              perPage={PAGE_SIZE}
            />
          </>
        )}
      </PageCard>
    </div>
  );
}
