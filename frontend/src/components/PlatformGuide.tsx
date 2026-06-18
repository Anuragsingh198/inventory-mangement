import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { Accordion, PageCard } from '../components';
import { FAVORITE_STAR_HELP, INVENTORY_FIND_GUIDE, INVENTORY_QUICK_ACTIONS } from '../lib/inventoryHelp';

function GuideLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="font-medium text-brand hover:underline">
      {children}
    </Link>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="ml-4 list-decimal space-y-1.5">
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

const guideSections = [
  {
    id: 'getting-started',
    title: 'Getting started',
    summary: 'First steps to use Ventorio in this demo environment',
    content: (
      <div className="space-y-3">
        <p>
          Ventorio is an inventory management platform for products, warehouses, procurement, sales, and reporting.
          This is a <strong>demo environment</strong> with sample data already loaded.
        </p>
        <StepList
          steps={[
            'Use the sidebar on the left to move between modules.',
            'Start on this Dashboard to see KPIs, charts, and alerts.',
            'Try different demo accounts (see Roles below) to see how permissions change the UI.',
            'Click any blue link below to jump directly to a module.',
          ]}
        />
        <p className="rounded-md bg-surface px-3 py-2 text-xs text-gray-500">
          Tip: Collapse this guide anytime — expand a section when you need help with that area.
        </p>
      </div>
    ),
  },
  {
    id: 'dashboard',
    title: 'How this dashboard works',
    summary: 'What the KPI cards, charts, and alerts mean',
    content: (
      <div className="space-y-3">
        <p>The dashboard pulls live data from your inventory database and updates when you refresh or navigate back here.</p>
        <ul className="space-y-2">
          <li>
            <strong>Total Products</strong> — number of products in your catalog (
            <GuideLink to="/listings">Listings</GuideLink>).
          </li>
          <li>
            <strong>Low Stock</strong> — items below their minimum threshold. Click alerts below or go to{' '}
            <GuideLink to="/notifications">Notifications</GuideLink>.
          </li>
          <li>
            <strong>Pending Orders</strong> — legacy orders awaiting action (
            <GuideLink to="/orders">Orders</GuideLink>).
          </li>
          <li>
            <strong>Stock Value</strong> — total value of inventory on hand (quantity × price).
          </li>
        </ul>
        <p>
          <strong>Charts on this page:</strong> warehouse value breakdown, fulfillment aging, top products by stock,
          revenue/cost trends, and units sold. For exportable reports, open{' '}
          <GuideLink to="/reports">Reports</GuideLink>.
        </p>
        <p>
          <strong>Recent Alerts</strong> — unread low-stock or out-of-stock warnings. Mark as read or configure email
          delivery in <GuideLink to="/notifications">Notifications</GuideLink>.
        </p>
      </div>
    ),
  },
  {
    id: 'roles',
    title: 'Demo accounts & roles',
    summary: 'Five logins — each role sees different actions',
    content: (
      <div className="space-y-3">
        <p>Log out and sign in with a different account to experience role-based access.</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Password</th>
                <th className="pb-2">What they can do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2 pr-4 font-mono">admin@inventory.com</td>
                <td className="py-2 pr-4">admin123</td>
                <td className="py-2">Full access — all modules and actions</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono">manager@inventory.com</td>
                <td className="py-2 pr-4">manager123</td>
                <td className="py-2">Products, suppliers, purchase orders, audits, warehouses</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono">warehouse@inventory.com</td>
                <td className="py-2 pr-4">warehouse123</td>
                <td className="py-2">Adjust stock, receive POs, fulfill sales, transfers</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono">sales@inventory.com</td>
                <td className="py-2 pr-4">sales123</td>
                <td className="py-2">Customers, sales orders, read inventory</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono">viewer@inventory.com</td>
                <td className="py-2 pr-4">viewer123</td>
                <td className="py-2">Read-only — no create, edit, or approve buttons</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  {
    id: 'listings',
    title: 'Product catalog (Listings)',
    summary: 'Create and manage products, SKUs, categories',
    content: (
      <div className="space-y-3">
        <p>
          Go to <GuideLink to="/listings">Listings</GuideLink> to browse, search, and filter products. Click a product
          name to open its <strong>detail page</strong> with variants and barcodes.
        </p>
        <FeatureList
          items={[
            'Create / edit / delete products (admin & manager)',
            'Assign categories and SKUs',
            'Search, sort, and paginate the catalog',
            'Product detail view at /listings/:id',
            'Favorites tab — star ⭐ any listing to pin it for quick access',
          ]}
        />
        <p className="rounded-md border border-sky-100 bg-sky-50/50 px-3 py-2 text-xs text-gray-600">
          <strong>Favorites:</strong> {FAVORITE_STAR_HELP}
        </p>
      </div>
    ),
  },
  {
    id: 'inventory',
    title: 'Inventory & warehouses',
    summary: 'Stock levels, adjustments, multi-warehouse',
    content: (
      <div className="space-y-3">
        <p>
          <GuideLink to="/inventory">Inventory</GuideLink> shows quantity, thresholds, and locations.{' '}
          <GuideLink to="/warehouses">Warehouses</GuideLink> manages multiple storage locations and transfers.
        </p>
        <StepList
          steps={[
            'Open Inventory → use Quick Actions to add items or export barcodes.',
            'Click Adjust on a row to increase/decrease stock (requires write permission).',
            'When stock drops below threshold, alerts appear on Dashboard and Notifications.',
            'Open Warehouses → click a warehouse for balances and transfer history.',
          ]}
        />
        <p className="font-medium text-gray-800">Quick actions — where to find what you create</p>
        <div className="overflow-x-auto rounded-md border border-gray-100">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b bg-gray-50/80 text-left text-gray-500">
                <th className="px-3 py-2 pr-4">Action</th>
                <th className="px-3 py-2">Where it appears</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(Object.keys(INVENTORY_QUICK_ACTIONS) as Array<keyof typeof INVENTORY_QUICK_ACTIONS>).map((id) => (
                <tr key={id}>
                  <td className="px-3 py-2 pr-4 font-medium text-gray-800">{INVENTORY_QUICK_ACTIONS[id].label}</td>
                  <td className="px-3 py-2 text-gray-600">{INVENTORY_QUICK_ACTIONS[id].where}</td>
                </tr>
              ))}
              <tr>
                <td className="px-3 py-2 pr-4 font-medium text-gray-800">Favorites ⭐</td>
                <td className="px-3 py-2 text-gray-600">
                  Star any row, then open <GuideLink to="/inventory">Inventory</GuideLink> or{' '}
                  <GuideLink to="/listings">Listings</GuideLink> → Favorites tab
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="space-y-1 text-xs text-gray-500">
          {INVENTORY_FIND_GUIDE.map(({ action, destination }) => (
            <li key={action}>
              <strong>{action}:</strong> {destination}
            </li>
          ))}
        </ul>
        <p className="rounded-md border border-sky-100 bg-sky-50/50 px-3 py-2 text-xs text-gray-600">
          Hover the <strong>ⓘ info icon</strong> on each quick-action card or beside the star in a table row for the same tips in context.
        </p>
        <FeatureList
          items={[
            'Stock adjustment with reason',
            'Low-stock & critical alerts (in-app + optional email)',
            'Multi-warehouse balances',
            'Warehouse detail pages at /warehouses/:id',
          ]}
        />
      </div>
    ),
  },
  {
    id: 'procurement',
    title: 'Procurement (Suppliers & purchase orders)',
    summary: 'Approve POs and receive stock into inventory',
    content: (
      <div className="space-y-3">
        <p>
          Manage vendors in <GuideLink to="/suppliers">Suppliers</GuideLink> and track buying in{' '}
          <GuideLink to="/purchases">Purchase Orders</GuideLink>.
        </p>
        <StepList
          steps={[
            'Manager: open Purchase Orders → find a pending PO → click Approve.',
            'Warehouse or manager: open an approved PO → click Receive Stock — inventory increases automatically.',
            'Click View on any PO row for line items and full details.',
          ]}
        />
        <FeatureList
          items={[
            'Supplier directory + detail pages',
            'PO lifecycle: pending → approved → received',
            'Receive stock updates inventory via StockMovementService',
            'Legacy orders still available under Procurement → Legacy Orders',
          ]}
        />
      </div>
    ),
  },
  {
    id: 'sales',
    title: 'Sales orders & fulfillment',
    summary: 'Customers, sales orders, payments, shipments',
    content: (
      <div className="space-y-3">
        <p>
          <GuideLink to="/sales">Sales Orders</GuideLink> handles customer orders.{' '}
          <GuideLink to="/payments">Payments</GuideLink> and <GuideLink to="/shipments">Shipments</GuideLink> cover
          legacy payment and shipping views.
        </p>
        <StepList
          steps={[
            'Browse sales orders and open a confirmed order.',
            'Warehouse staff: click Fulfill Order — stock is deducted from inventory.',
            'View customer details and line items on the sales order detail page.',
          ]}
        />
        <FeatureList
          items={[
            'Customer management',
            'Sales order detail at /sales/:id',
            'Fulfillment deducts stock automatically',
            'Sales channels overview at /sales-channels',
          ]}
        />
      </div>
    ),
  },
  {
    id: 'analytics',
    title: 'Reports & AI assistant',
    summary: 'Analytics export, forecasting, and smart queries',
    content: (
      <div className="space-y-3">
        <p>
          <GuideLink to="/reports">Reports</GuideLink> — summary stats, date filters, and CSV export of inventory.{' '}
          Use the floating <strong>Smart Inventory Assistant</strong> button (bottom-right on every page) to ask
          questions like “Which products will run out next week?” — demo mock responses only.
        </p>
        <FeatureList
          items={[
            'Dashboard KPIs (this page)',
            'Inventory CSV export',
            'Demand forecasting (/ai/forecast)',
            'Dead stock & near-expiry insights',
            'Natural-language inventory questions',
          ]}
        />
      </div>
    ),
  },
  {
    id: 'notifications',
    title: 'Notifications, email & activity logs',
    summary: 'Alerts inbox, Resend email, audit trail',
    content: (
      <div className="space-y-3">
        <p>
          <GuideLink to="/notifications">Notifications</GuideLink> — low-stock alert inbox. Mark alerts as read. Admins
          see email config and can send a <strong>test email</strong> (requires Resend API key in backend/.env).
        </p>
        <p>
          <GuideLink to="/activity-logs">Activity Logs</GuideLink> — who did what (logins, stock changes, approvals).
        </p>
        <StepList
          steps={[
            'Adjust stock below threshold → alert appears here and on Dashboard.',
            'If Resend is configured, email goes to ALERT_EMAIL_RECIPIENTS.',
            'Use “Send test email” on Notifications to verify delivery.',
          ]}
        />
      </div>
    ),
  },
  {
    id: 'workflows',
    title: 'Recommended workflows',
    summary: 'End-to-end paths to try in the demo',
    content: (
      <div className="space-y-4">
        <div>
          <p className="font-medium text-gray-800">Inventory manager daily flow</p>
          <StepList
            steps={[
              'Dashboard → check Low Stock KPI and Recent Alerts.',
              'Purchases → approve pending PO → receive stock.',
              'Inventory → verify quantities updated.',
              'Reports → export CSV if needed.',
            ]}
          />
        </div>
        <div>
          <p className="font-medium text-gray-800">Warehouse staff flow</p>
          <StepList
            steps={[
              'Inventory → adjust stock or review levels.',
              'Purchases → receive approved POs.',
              'Sales → fulfill confirmed orders.',
              'Warehouses → review transfers between locations.',
            ]}
          />
        </div>
        <div>
          <p className="font-medium text-gray-800">Sales executive flow</p>
          <StepList
            steps={[
              'Listings → check product availability.',
              'Sales → review and manage sales orders.',
              'Floating assistant (bottom-right) → ask about stock or demand (mock demo).',
            ]}
          />
        </div>
      </div>
    ),
  },
  {
    id: 'features',
    title: 'Everything that is working',
    summary: 'Full feature checklist for this platform',
    content: (
      <FeatureList
        items={[
          'JWT login with 5 role-based demo accounts',
          'Product catalog with detail pages, categories, search',
          'Inventory management with stock adjustments & thresholds',
          'Multi-warehouse management & transfers',
          'Suppliers & purchase orders (approve / receive)',
          'Customers & sales orders (fulfill)',
          'Legacy orders, payments, shipments',
          'Low-stock alerts (in-app + Resend email when configured)',
          'Dashboard KPIs and charts',
          'Reports with CSV export',
          'AI assistant, forecasting, dead-stock insights',
          'Activity logs & login history',
          'Batches, serials, inventory audits (API + seed data)',
          'Import / export CSV for products & inventory',
        ]}
      />
    ),
  },
];

export function PlatformGuide() {
  return (
    <PageCard className="border-brand/20 bg-gradient-to-br from-white to-surface/50">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sidebar text-white">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-800">Platform guide</h2>
          <p className="text-sm text-gray-500">
            Expand each section to learn how Ventorio works and where to go next.
          </p>
        </div>
      </div>
      <Accordion items={guideSections} defaultOpenId="getting-started" />
    </PageCard>
  );
}
