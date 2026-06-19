import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Building2,
  DollarSign,
  Download,
  FileText,
  Info,
  Package,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Warehouse,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { exportInventory, getReportSummary } from '../api/reports';
import { AlertItem, ErrorState, HeaderButton, HeaderIconButton, LoadingSkeleton, OutlineButton, PageCard, PageHeader, PrimaryButton, StatCard } from '../components';
import { useChatbot } from '../context/ChatbotContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAlertMutations, useAlerts } from '../hooks/useAlerts';
import { useQuery } from '@tanstack/react-query';
import { PAGE_DESCRIPTIONS } from '../lib/pageMeta';
import { formatCurrency, SALES_CHANNELS } from '../lib/utils';

type ChartRange = '7d' | '30d' | '90d';
type GraphTab = 'revenue' | 'products' | 'channels' | 'units' | 'orders';

const GRAPH_TABS: { id: GraphTab; label: string }[] = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'products', label: 'Top Products' },
  { id: 'channels', label: 'Channels' },
  { id: 'units', label: 'Units Sold' },
  { id: 'orders', label: 'Orders' },
];

const REVENUE_BY_RANGE: Record<ChartRange, { day: string; revenue: number; costs: number }[]> = {
  '7d': [
    { day: 'Mon', revenue: 4200, costs: 2800 },
    { day: 'Tue', revenue: 5100, costs: 3100 },
    { day: 'Wed', revenue: 4800, costs: 2900 },
    { day: 'Thu', revenue: 5600, costs: 3400 },
    { day: 'Fri', revenue: 5300, costs: 3200 },
    { day: 'Sat', revenue: 6100, costs: 3600 },
    { day: 'Sun', revenue: 4900, costs: 3000 },
  ],
  '30d': [
    { day: 'W1', revenue: 18200, costs: 11200 },
    { day: 'W2', revenue: 21400, costs: 12800 },
    { day: 'W3', revenue: 19800, costs: 12100 },
    { day: 'W4', revenue: 23100, costs: 13900 },
  ],
  '90d': [
    { day: 'Jan', revenue: 62000, costs: 38000 },
    { day: 'Feb', revenue: 58400, costs: 35200 },
    { day: 'Mar', revenue: 71200, costs: 41800 },
  ],
};

const UNITS_TREND = REVENUE_BY_RANGE['7d'].map((d, i) => ({ day: d.day, units: 6200 + i * 380 }));

const QUICK_ACTIONS = [
  { label: 'Products', desc: 'Catalog & SKUs', to: '/listings', icon: Package, color: 'bg-brand/10 text-brand' },
  { label: 'Inventory', desc: 'Stock levels', to: '/inventory', icon: Warehouse, color: 'bg-sidebar/10 text-sidebar' },
  { label: 'Purchases', desc: 'PO workflow', to: '/purchases', icon: Building2, color: 'bg-violet-100 text-violet-700' },
  { label: 'Sales', desc: 'Orders & fulfill', to: '/sales', icon: ShoppingCart, color: 'bg-emerald-100 text-emerald-700' },
  { label: 'Reports', desc: 'Export & KPIs', to: '/reports', icon: BarChart3, color: 'bg-amber-100 text-amber-700' },
  { label: 'AI Assistant', desc: 'Smart insights', to: 'chatbot', icon: Sparkles, color: 'bg-mint/20 text-mint-dark' },
] as const;

const CHART_HEIGHT = 300;

const CHART_COLORS = ['#234e7d', '#00aaff', '#5bc0de', '#f0ad4e', '#10b981', '#8b5cf6'];

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const isMoney = (name: string) => /revenue|cost|value/i.test(name);
  return (
    <div className="dashboard-chart-tooltip">
      <p className="mb-1 font-semibold text-gray-800">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {isMoney(entry.name) ? formatCurrency(entry.value) : entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

function RangeTabs({ value, onChange }: { value: ChartRange; onChange: (v: ChartRange) => void }) {
  const options: ChartRange[] = ['7d', '30d', '90d'];
  return (
    <div className="flex rounded-lg bg-gray-100/80 p-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
            value === opt ? 'bg-white text-sidebar shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { open: openChatbot } = useChatbot();
  const { showToast } = useToast();
  const [chartRange, setChartRange] = useState<ChartRange>('7d');
  const [activeGraph, setActiveGraph] = useState<GraphTab>('revenue');
  const [exporting, setExporting] = useState(false);

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: getReportSummary,
  });
  const { data: alerts } = useAlerts(true);
  const { markRead } = useAlertMutations();

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (error) return <ErrorState message="Failed to load dashboard" />;
  if (!summary) return null;

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'there';
  const revenueData = REVENUE_BY_RANGE[chartRange];
  const stockValue = Number(summary.total_stock_value);
  const maxProductQty = Math.max(...summary.top_products_by_stock.map((p) => p.quantity), 1);

  const warehouseData = SALES_CHANNELS.slice(0, 5).map((name, i) => ({
    name: name.length > 10 ? `${name.slice(0, 9)}…` : name,
    fullName: name,
    value: Math.round(stockValue / (i + 2.5)),
  }));

  const orderStats = [
    { label: 'Pending', value: summary.pending_orders, color: 'bg-amber-500' },
    { label: 'Received', value: summary.received_orders, color: 'bg-emerald-500' },
    { label: 'Cancelled', value: summary.cancelled_orders, color: 'bg-gray-400' },
  ];
  const orderTotal = orderStats.reduce((s, o) => s + o.value, 0) || 1;

  const orderBarData = [
    { name: 'Pending', value: summary.pending_orders, fill: '#f59e0b' },
    { name: 'Received', value: summary.received_orders, fill: '#10b981' },
    { name: 'Cancelled', value: summary.cancelled_orders, fill: '#9ca3af' },
  ];

  const graphDescriptions: Record<GraphTab, string> = {
    revenue: 'Revenue vs costs over time — use 7D / 30D / 90D to change range',
    products: 'Products with the highest on-hand stock quantities',
    channels: 'Estimated stock value distributed across sales channels',
    units: 'Daily units sold trend for the current week',
    orders: 'Breakdown of legacy orders by status',
  };

  const renderActiveGraph = () => {
    switch (activeGraph) {
      case 'revenue':
        return (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00aaff" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#00aaff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="costsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Area isAnimationActive animationDuration={400} type="monotone" dataKey="revenue" name="Revenue" stroke="#00aaff" strokeWidth={2.5} fill="url(#revenueGrad)" />
              <Area isAnimationActive animationDuration={400} type="monotone" dataKey="costs" name="Costs" stroke="#ef4444" strokeWidth={2} fill="url(#costsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'products':
        return (
          <div className="h-full overflow-y-auto px-1 pr-2">
            <div className="flex h-full flex-col justify-center space-y-3.5 py-1">
              {summary.top_products_by_stock.slice(0, 8).map((product, i) => (
                <button
                  key={product.name}
                  type="button"
                  onClick={() => navigate('/listings')}
                  className="group w-full text-left"
                >
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="truncate font-medium text-gray-800 group-hover:text-brand">{product.name}</span>
                    <span className="ml-2 shrink-0 font-semibold text-gray-600">{product.quantity} units</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(product.quantity / maxProductQty) * 100}%`,
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case 'channels':
        return (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={warehouseData} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [formatCurrency(Number(v ?? 0)), 'Value']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Bar isAnimationActive animationDuration={400} dataKey="value" radius={[0, 8, 8, 0]} barSize={22}>
                {warehouseData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'units':
        return (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <LineChart data={UNITS_TREND}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(1)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Line isAnimationActive animationDuration={400} type="monotone" dataKey="units" name="Units" stroke="#234e7d" strokeWidth={2.5} dot={{ r: 4, fill: '#234e7d' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'orders':
        return (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={orderBarData} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar isAnimationActive animationDuration={400} dataKey="value" name="Orders" radius={[8, 8, 0, 0]} barSize={48}>
                {orderBarData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

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

  const reportMetrics = [
    { label: 'Products', value: summary.total_products, icon: Package, color: 'text-sidebar bg-sidebar/10' },
    { label: 'Stock value', value: formatCurrency(stockValue), icon: DollarSign, color: 'text-mint-dark bg-mint/15' },
    { label: 'Pending', value: summary.pending_orders, icon: ShoppingCart, color: 'text-brand bg-brand/10' },
    { label: 'Received', value: summary.received_orders, icon: FileText, color: 'text-emerald-700 bg-emerald-100' },
    { label: 'Cancelled', value: summary.cancelled_orders, icon: BarChart3, color: 'text-gray-600 bg-gray-100' },
    { label: 'Low stock', value: summary.low_stock_count, icon: AlertTriangle, color: 'text-amber-700 bg-amber-100' },
  ];

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title={`Welcome back, ${displayName}`}
        description={PAGE_DESCRIPTIONS.dashboard}
        action={
          <>
            <HeaderButton onClick={() => navigate('/guide')}>
              <BookOpen className="h-4 w-4" />
              Platform Guide
            </HeaderButton>
            <HeaderIconButton
              title="Step-by-step help for every module, demo accounts, and workflows"
              aria-label="About the platform guide"
              onClick={() => navigate('/guide')}
            >
              <Info className="h-4 w-4" />
            </HeaderIconButton>
          </>
        }
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[repeat(4,minmax(0,1fr))]">
        <StatCard
          title="Total Products"
          value={summary.total_products}
          subtitle="Active catalog items"
          trend={{ label: 'View catalog →', positive: true }}
          icon={<Package className="h-6 w-6" />}
          accent="navy"
          onClick={() => navigate('/listings')}
        />
        <StatCard
          title="Low Stock"
          value={summary.low_stock_count}
          subtitle="Below minimum threshold"
          trend={{ label: alerts?.length ? `${alerts.length} unread alerts` : 'All clear', positive: !alerts?.length }}
          icon={<AlertTriangle className="h-6 w-6" />}
          accent="amber"
          onClick={() => navigate('/notifications')}
        />
        <StatCard
          title="Pending Orders"
          value={summary.pending_orders}
          subtitle="Awaiting fulfillment"
          icon={<ShoppingCart className="h-6 w-6" />}
          accent="blue"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          title="Stock Value"
          value={formatCurrency(stockValue)}
          subtitle="Total on-hand value"
          icon={<DollarSign className="h-6 w-6" />}
          accent="mint"
          onClick={() => navigate('/reports')}
        />
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Quick actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_ACTIONS.map(({ label, desc, to, icon: Icon, color }) => (
            <button
              key={label}
              type="button"
              onClick={() => (to === 'chatbot' ? openChatbot() : navigate(to))}
              className="group flex flex-col items-start rounded-xl border border-gray-200/80 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md"
            >
              <div className={`mb-3 rounded-lg p-2.5 ${color} transition group-hover:scale-110`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-gray-800">{label}</span>
              <span className="mt-0.5 text-xs text-gray-500">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Reports */}
      <PageCard className="w-full">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-sidebar" />
              <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Summary metrics and inventory export — open full reports for detailed tables and filters.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <OutlineButton loading={exporting} onClick={handleExport}>
              <span className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </span>
            </OutlineButton>
            <PrimaryButton onClick={() => navigate('/reports')}>
              <span className="flex items-center gap-2">
                Full reports
                <ArrowRight className="h-4 w-4" />
              </span>
            </PrimaryButton>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))] 2xl:grid-cols-[repeat(6,minmax(0,1fr))]">
          {reportMetrics.map(({ label, value, icon: Icon, color }) => (
            <button
              key={label}
              type="button"
              onClick={() => navigate('/reports')}
              className="flex min-w-0 overflow-hidden rounded-xl border border-gray-200/80 bg-gray-50/50 p-4 text-left transition hover:border-brand/30 hover:bg-white hover:shadow-sm"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className={`shrink-0 rounded-lg p-2.5 ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="truncate text-xs font-medium text-gray-500">{label}</p>
                  <p className="truncate text-sm font-bold tabular-nums text-gray-900 sm:text-base lg:text-lg" title={String(value)}>
                    {value}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </PageCard>

      {/* Analytics — full width */}
      <div className="overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
            </div>
            <p key={activeGraph} className="dashboard-graph-panel mt-1 text-xs text-gray-500">
              {graphDescriptions[activeGraph]}
            </p>
          </div>
          {activeGraph === 'revenue' && (
            <RangeTabs value={chartRange} onChange={setChartRange} />
          )}
        </div>

        <div key={activeGraph} className="dashboard-graph-panel w-full px-5" style={{ height: CHART_HEIGHT }}>
          {renderActiveGraph()}
        </div>

        {activeGraph === 'revenue' && (
          <div className="flex gap-6 px-5 pb-3 text-xs">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-brand" /> Revenue</span>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Costs</span>
          </div>
        )}

        <div className="flex border-t border-gray-200">
          {GRAPH_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveGraph(tab.id)}
              className={`dashboard-tab-btn flex flex-1 items-center justify-center border-t-2 px-2 py-3.5 text-xs font-semibold sm:text-sm ${
                activeGraph === tab.id
                  ? 'border-brand bg-brand/5 text-brand'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts + order status — compact row below charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <PageCard className="border-amber-200/60 bg-gradient-to-b from-amber-50/30 to-white">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Recent alerts</h2>
            {(alerts?.length ?? 0) > 0 ? (
              <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">{alerts?.length ?? 0}</span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Clear</span>
            )}
          </div>
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {!alerts?.length && (
              <p className="py-4 text-center text-sm text-gray-400">No unread alerts</p>
            )}
            {alerts?.slice(0, 4).map((alert) => (
              <AlertItem
                key={alert.id}
                message={alert.message}
                type={alert.alert_type}
                createdAt={alert.created_at}
                markReadLoading={markRead.isPending && markRead.variables === alert.id}
                onMarkRead={() => markRead.mutate(alert.id)}
              />
            ))}
          </div>
          {(alerts?.length ?? 0) > 0 && (
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="mt-3 flex w-full items-center justify-center gap-1 text-sm font-medium text-brand hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </PageCard>

        <PageCard>
          <h2 className="mb-3 text-base font-semibold text-gray-900">Order status</h2>
          <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-gray-100">
            {orderStats.map((s) => (
              <div
                key={s.label}
                className={`${s.color} transition-all`}
                style={{ width: `${(s.value / orderTotal) * 100}%` }}
                title={`${s.label}: ${s.value}`}
              />
            ))}
          </div>
          <div className="space-y-2">
            {orderStats.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => navigate('/orders')}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm transition hover:bg-gray-50"
              >
                <span className="flex items-center gap-2 text-gray-600">
                  <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                  {s.label}
                </span>
                <span className="font-semibold text-gray-900">{s.value}</span>
              </button>
            ))}
          </div>
        </PageCard>
      </div>
    </div>
  );
}
