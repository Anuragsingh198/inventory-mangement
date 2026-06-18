import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { exportInventory, getReportSummary } from '../api/reports';
import type { InventorySort } from '../api/inventory';
import type { OrderSort } from '../api/orders';
import {
  DateFilterInput,
  ErrorState,
  FilterInput,
  LoadingSkeleton,
  PageCard,
  PageHeader,
  Pagination,
  HeaderButton,
  SortSelect,
  StatCard,
  TabBar,
  Table,
  TableArea,
} from '../components';
import { useToast } from '../context/ToastContext';
import { usePageSize } from '../context/PageSizeContext';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useInventory } from '../hooks/useInventory';
import { useOrders } from '../hooks/useOrders';
import { useResetPageOnFilterChange } from '../hooks/useResetPageOnFilterChange';
import { PAGE_DESCRIPTIONS } from '../lib/pageMeta';

type ReportTab = 'orders' | 'inventory';

export function ReportsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ReportTab>('orders');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderSort, setOrderSort] = useState<OrderSort>('newest');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventorySort, setInventorySort] = useState<InventorySort>('name');
  const [ordersPage, setOrdersPage] = useState(1);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const { pageSize } = usePageSize();
  const dateRangeInvalid = Boolean(startDate && endDate && startDate > endDate);
  const apiStartDate = dateRangeInvalid ? undefined : startDate || undefined;
  const apiEndDate = dateRangeInvalid ? undefined : endDate || undefined;

  const orderSearchParam = useDebouncedValue(orderSearch.trim(), 300) || undefined;
  const inventorySearchParam = useDebouncedValue(inventorySearch.trim(), 300) || undefined;
  useResetPageOnFilterChange(setOrdersPage, [orderSearchParam, apiStartDate, apiEndDate, pageSize, orderSort]);
  useResetPageOnFilterChange(setInventoryPage, [inventorySearchParam, pageSize, inventorySort]);

  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: getReportSummary,
  });
  const {
    data: inventoryData,
    isLoading: inventoryLoading,
    isFetching: inventoryFetching,
    error: inventoryError,
  } = useInventory(inventorySearchParam, { page: inventoryPage, pageSize, sort: inventorySort });
  const {
    data: ordersData,
    isLoading: ordersLoading,
    isFetching: ordersFetching,
    error: ordersError,
  } = useOrders(undefined, apiStartDate, apiEndDate, orderSearchParam, { page: ordersPage, pageSize, sort: orderSort });

  const orders = ordersData?.items ?? [];
  const ordersTotal = ordersData?.total ?? 0;
  const ordersPages = ordersData?.pages ?? 1;
  const inventory = inventoryData?.items ?? [];
  const inventoryTotal = inventoryData?.total ?? 0;
  const inventoryPages = inventoryData?.pages ?? 1;

  const ordersTableSkeleton = ordersLoading && !ordersData;
  const inventoryTableSkeleton = inventoryLoading && !inventoryData;
  const ordersTableLoading = ordersFetching && !ordersTableSkeleton;
  const inventoryTableLoading = inventoryFetching && !inventoryTableSkeleton;

  const handleExport = async () => {
    setExporting(true);
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
    } finally {
      setExporting(false);
    }
  };

  if (summaryLoading && !summary) return <LoadingSkeleton rows={4} />;
  if (summaryError) return <ErrorState message="Failed to load reports" />;
  if (!summary) return null;

  return (
    <div>
      <PageHeader
        title="Reports"
        description={PAGE_DESCRIPTIONS.reports}
        action={
          <HeaderButton loading={exporting} onClick={handleExport}>
            <Download className="h-4 w-4" /> Export CSV
          </HeaderButton>
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
            { id: 'orders', label: 'Orders Report', count: ordersTotal },
            { id: 'inventory', label: 'Inventory Overview', count: inventoryTotal },
          ]}
        />

        {activeTab === 'orders' && (
          <>
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <div className="w-full sm:w-auto sm:min-w-[10rem]">
                <DateFilterInput
                  label="From date"
                  hint="Include orders on and after this day"
                  value={startDate}
                  onChange={setStartDate}
                />
              </div>
              <div className="w-full sm:w-auto sm:min-w-[10rem]">
                <DateFilterInput
                  label="Through date"
                  hint="Include orders through end of this day"
                  value={endDate}
                  onChange={setEndDate}
                />
              </div>
              <FilterInput
                value={orderSearch}
                onChange={setOrderSearch}
                placeholder="Order #, supplier, status, product..."
                className="w-full sm:w-72"
              />
              <SortSelect
                value={orderSort}
                onChange={(value) => setOrderSort(value as OrderSort)}
                defaultValue="newest"
                className="shrink-0"
                options={[
                  { value: 'newest', label: 'Sort: Newest' },
                  { value: 'oldest', label: 'Sort: Oldest' },
                  { value: 'customer', label: 'Sort: Customer' },
                ]}
              />
            </div>
            {dateRangeInvalid && (
              <p className="mb-3 text-sm text-red-600">
                Through date must be on or after the from date. Adjust the range to filter results.
              </p>
            )}
            {!dateRangeInvalid && (startDate || endDate) && (
              <p className="mb-3 text-sm text-gray-500">
                Showing orders
                {startDate && endDate
                  ? ` from ${startDate} through ${endDate} (inclusive)`
                  : startDate
                    ? ` on or after ${startDate}`
                    : ` through ${endDate} (inclusive)`}
                .
              </p>
            )}
            <TableArea loading={ordersTableLoading}>
              {ordersError && !ordersData ? (
                <ErrorState message="Failed to load orders" />
              ) : ordersTableSkeleton ? (
                <LoadingSkeleton rows={6} />
              ) : (
                <>
                  <Table headers={['ID', 'Supplier', 'Status', 'Items', 'Date']}>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-4 py-3 text-sm">#{order.id}</td>
                        <td className="px-4 py-3 text-sm">{order.supplier}</td>
                        <td className="px-4 py-3 text-sm capitalize">{order.status}</td>
                        <td className="px-4 py-3 text-sm">{order.items.length}</td>
                        <td className="px-4 py-3 text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {ordersTotal === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No orders found</td>
                      </tr>
                    )}
                  </Table>
                  <Pagination
                    page={ordersPage}
                    total={ordersPages}
                    onChange={setOrdersPage}
                    totalItems={ordersTotal}
                  />
                </>
              )}
            </TableArea>
          </>
        )}

        {activeTab === 'inventory' && (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <FilterInput
                value={inventorySearch}
                onChange={setInventorySearch}
                placeholder="ID, product, SKU, category, location, qty..."
                className="w-full sm:w-72"
              />
              <SortSelect
                value={inventorySort}
                onChange={(value) => setInventorySort(value as InventorySort)}
                defaultValue="name"
                className="shrink-0"
                options={[
                  { value: 'name', label: 'Sort: Name' },
                  { value: 'quantity', label: 'Sort: Qty' },
                  { value: 'location', label: 'Sort: Location' },
                ]}
              />
            </div>
            <TableArea loading={inventoryTableLoading}>
              {inventoryError && !inventoryData ? (
                <ErrorState message="Failed to load inventory" />
              ) : inventoryTableSkeleton ? (
                <LoadingSkeleton rows={6} />
              ) : (
                <>
                  <Table headers={['Product', 'SKU', 'Quantity', 'Threshold', 'Location', 'Value']}>
                    {inventory.map((item) => (
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
                    {inventoryTotal === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No inventory items found</td>
                      </tr>
                    )}
                  </Table>
                  <Pagination
                    page={inventoryPage}
                    total={inventoryPages}
                    onChange={setInventoryPage}
                    totalItems={inventoryTotal}
                  />
                </>
              )}
            </TableArea>
          </>
        )}
      </PageCard>
    </div>
  );
}
