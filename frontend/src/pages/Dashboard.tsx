import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, DollarSign, Package, ShoppingCart } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getReportSummary } from '../api/reports';
import { AlertItem, ErrorState, LoadingSkeleton, PageCard, PageHeader, StatCard } from '../components';
import { useAlertMutations, useAlerts } from '../hooks/useAlerts';
import { SALES_CHANNELS } from '../lib/utils';

const revenueData = [
  { day: 'Oct 6', revenue: 4200, costs: 2800 },
  { day: 'Oct 7', revenue: 5100, costs: 3100 },
  { day: 'Oct 8', revenue: 4800, costs: 2900 },
  { day: 'Oct 9', revenue: 5600, costs: 3400 },
  { day: 'Oct 10', revenue: 5300, costs: 3200 },
];

const unitsData = [
  { day: 'Oct 6', units: 6200 },
  { day: 'Oct 7', units: 7100 },
  { day: 'Oct 8', units: 6800 },
  { day: 'Oct 9', units: 8200 },
  { day: 'Oct 10', units: 7600 },
];

export function DashboardPage() {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: getReportSummary,
  });
  const { data: alerts } = useAlerts(true);
  const { markRead } = useAlertMutations();

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (error) return <ErrorState message="Failed to load dashboard" />;
  if (!summary) return null;

  const channelData = SALES_CHANNELS.slice(0, 7).map((name, i) => ({
    name,
    value: Math.round(Number(summary.total_stock_value) / (i + 3)),
  }));

  const fulfillmentData = [
    { age: '<1', ...Object.fromEntries(SALES_CHANNELS.slice(0, 4).map((c, i) => [c, (i + 1) * 3])) },
    { age: '1', ...Object.fromEntries(SALES_CHANNELS.slice(0, 4).map((c, i) => [c, (i + 2) * 2])) },
    { age: '2', ...Object.fromEntries(SALES_CHANNELS.slice(0, 4).map((c, i) => [c, i + 3])) },
    { age: '3', ...Object.fromEntries(SALES_CHANNELS.slice(0, 4).map((c, i) => [c, i + 1])) },
    { age: '>3', ...Object.fromEntries(SALES_CHANNELS.slice(0, 4).map((c, i) => [c, i])) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Products" value={summary.total_products} icon={<Package className="h-6 w-6" />} accent="navy" />
        <StatCard title="Low Stock" value={summary.low_stock_count} icon={<AlertTriangle className="h-6 w-6" />} accent="amber" />
        <StatCard title="Pending Orders" value={summary.pending_orders} icon={<ShoppingCart className="h-6 w-6" />} accent="blue" />
        <StatCard title="Stock Value" value={`$${Number(summary.total_stock_value).toLocaleString()}`} icon={<DollarSign className="h-6 w-6" />} accent="mint" />
      </div>

      <PageCard>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-600">Inventory Value By Warehouse</h2>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={channelData} layout="vertical">
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip />
            <Bar dataKey="value" fill="#00aaff" radius={4} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
          {channelData.map((c) => (
            <span key={c.name}>{c.name}: ${c.value.toLocaleString()}</span>
          ))}
        </div>
      </PageCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <PageCard>
          <h2 className="mb-4 text-base font-semibold">Orders Awaiting Fulfillment</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fulfillmentData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="age" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              {SALES_CHANNELS.slice(0, 4).map((ch, i) => (
                <Bar key={ch} dataKey={ch} fill={['#234e7d', '#5bc0de', '#00aaff', '#f0ad4e'][i]} stackId="a" />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </PageCard>

        <PageCard>
          <h2 className="mb-4 text-base font-semibold">Top Products by Stock</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={summary.top_products_by_stock.slice(0, 6)}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="quantity" stroke="#00aaff" fill="#b3e5fc" />
            </AreaChart>
          </ResponsiveContainer>
        </PageCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <PageCard>
          <h2 className="mb-4 text-base font-semibold">Revenue vs Costs</h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="costs" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </PageCard>

        <PageCard>
          <h2 className="mb-4 text-base font-semibold">Units Sold</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={unitsData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="units" fill="#234e7d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </PageCard>

        <PageCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent Alerts</h2>
            {(alerts?.length ?? 0) > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">{alerts?.length}</span>
            )}
          </div>
          <div className="space-y-2">
            {alerts?.length === 0 && <p className="text-sm text-gray-400">No unread alerts</p>}
            {alerts?.slice(0, 4).map((alert) => (
              <AlertItem
                key={alert.id}
                message={alert.message}
                type={alert.alert_type}
                createdAt={alert.created_at}
                onMarkRead={() => markRead.mutate(alert.id)}
              />
            ))}
          </div>
        </PageCard>
      </div>
    </div>
  );
}
