import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { Accordion, PageCard } from '../components';
import { FAVORITE_STAR_HELP, INVENTORY_QUICK_ACTIONS } from '../lib/inventoryHelp';

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
    summary: 'How to navigate Ventorio and try the demo',
    content: (
      <div className="space-y-3">
        <p>
          Ventorio helps you manage products, stock, purchasing, sales, and reports in one place.
          This demo is pre-loaded with sample data so you can explore right away.
        </p>
        <StepList
          steps={[
            'Use the sidebar to open any area — Dashboard, Listings, Inventory, and more.',
            'Start on the Dashboard for a quick overview of stock, orders, and alerts.',
            'Sign in with different demo roles to see how access changes what you can do.',
            'Click any blue link in this guide to jump straight to that page.',
          ]}
        />
        <p className="rounded-md bg-surface px-3 py-2 text-sm text-gray-600">
          Tip: Expand only the sections you need — each one explains what that part of the app is for.
        </p>
      </div>
    ),
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    summary: 'Your overview of stock, orders, and alerts',
    content: (
      <div className="space-y-3">
        <p>
          The <GuideLink to="/dashboard">Dashboard</GuideLink> shows live numbers and charts so you can spot issues quickly.
        </p>
        <ul className="space-y-2 text-sm">
          <li><strong>Total Products</strong> — how many items are in your catalog.</li>
          <li><strong>Low Stock</strong> — products running below their minimum level.</li>
          <li><strong>Pending Orders</strong> — orders still waiting to be completed.</li>
          <li><strong>Stock Value</strong> — total value of everything you have on hand.</li>
        </ul>
        <p>
          Charts show trends such as top products, channel breakdown, and revenue. Recent alerts highlight
          items that need attention — open <GuideLink to="/notifications">Notifications</GuideLink> to review them all.
        </p>
      </div>
    ),
  },
  {
    id: 'roles',
    title: 'Demo sign-in accounts',
    summary: 'Try different roles to see what each user can do',
    content: (
      <div className="space-y-3">
        <p>
          Log out and sign in again with another account. On the login page, use the quick role buttons
          or enter the email and password below.
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/80 text-left text-gray-500">
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">What you can do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-3 py-2 font-medium">Admin</td>
                <td className="px-3 py-2 text-gray-600">Full access — create, edit, approve, and view everything.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Manager</td>
                <td className="px-3 py-2 text-gray-600">Manage products, suppliers, purchase orders, and warehouses.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Warehouse</td>
                <td className="px-3 py-2 text-gray-600">Adjust stock, receive purchases, and fulfill sales orders.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Sales</td>
                <td className="px-3 py-2 text-gray-600">Work with customers and sales orders; view stock levels.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">Viewer</td>
                <td className="px-3 py-2 text-gray-600">Look only — no create, edit, or approve buttons.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-500">
          Demo passwords follow the pattern <em>role123</em> (for example, admin123 for Admin). Hover a role button on the login page for details.
        </p>
      </div>
    ),
  },
  {
    id: 'listings',
    title: 'Listings (product catalog)',
    summary: 'Browse, search, and manage your products',
    content: (
      <div className="space-y-3">
        <p>
          <GuideLink to="/listings">Listings</GuideLink> is your product catalog. Search by name, SKU, or ID;
          sort by name, price, or quantity; and open any product for full details.
        </p>
        <FeatureList
          items={[
            'Create and edit products with name, SKU, category, price, and image',
            'See which sales channels each product is listed on',
            'Use the Favorites tab to keep important products in one place',
            'Filter by marketplace when you arrive from Sales Channels',
          ]}
        />
        <p className="rounded-md border border-sky-100 bg-sky-50/50 px-3 py-2 text-sm text-gray-600">
          <strong>Favorites:</strong> {FAVORITE_STAR_HELP}
        </p>
      </div>
    ),
  },
  {
    id: 'inventory',
    title: 'Inventory',
    summary: 'Track quantities, groups, prices, and favorites',
    content: (
      <div className="space-y-3">
        <p>
          <GuideLink to="/inventory">Inventory</GuideLink> shows how much stock you have, where it sits, and when levels are low.
          Use the tabs for Items, Favorites, Item Groups, and Price List.
        </p>
        <p className="font-medium text-gray-800">Quick actions at the top</p>
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/80 text-left text-gray-500">
                <th className="px-3 py-2 pr-4">Action</th>
                <th className="px-3 py-2">Where to find it after saving</th>
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
                <td className="px-3 py-2 pr-4 font-medium text-gray-800">Favorites</td>
                <td className="px-3 py-2 text-gray-600">
                  Star any row, then open the Favorites tab on Inventory or Listings
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-gray-500">
          Tap the <strong>ⓘ</strong> icon on a quick-action card or beside the star in a table for short tips.
        </p>
        <FeatureList
          items={[
            'Adjust stock up or down and add a reason',
            'Get alerts when quantity falls below the minimum',
            'View and manage item groups (categories)',
            'Export barcodes as a spreadsheet file',
          ]}
        />
      </div>
    ),
  },
  {
    id: 'warehouses',
    title: 'Warehouses',
    summary: 'Multiple locations and stock transfers',
    content: (
      <div className="space-y-3">
        <p>
          <GuideLink to="/warehouses">Warehouses</GuideLink> lets you manage more than one storage location.
          Open any warehouse to see what is stored there and review transfer history.
        </p>
        <FeatureList
          items={[
            'See stock held at each warehouse',
            'Move inventory between locations',
            'Review balances and recent activity per site',
          ]}
        />
      </div>
    ),
  },
  {
    id: 'sales-channels',
    title: 'Sales channels',
    summary: 'Marketplaces where your products are listed',
    content: (
      <div className="space-y-3">
        <p>
          <GuideLink to="/sales-channels">Sales Channels</GuideLink> shows connected marketplaces such as Amazon, eBay, and Etsy.
          Each card displays how many listings you have and estimated revenue on that channel.
        </p>
        <StepList
          steps={[
            'Click a channel card to see only the products listed there.',
            'Use Connect Channel to pick a marketplace from the list.',
            'In Listings, channel names are clickable — tap one to filter by that marketplace.',
          ]}
        />
      </div>
    ),
  },
  {
    id: 'procurement',
    title: 'Purchasing & suppliers',
    summary: 'Buy from vendors and receive stock',
    content: (
      <div className="space-y-3">
        <p>
          Keep vendor details in <GuideLink to="/suppliers">Suppliers</GuideLink> and raise orders in{' '}
          <GuideLink to="/purchases">Purchase Orders</GuideLink>.
        </p>
        <StepList
          steps={[
            'Create or review a purchase order with the items you need.',
            'A manager approves the order when ready.',
            'Warehouse staff receive the goods — stock in Inventory updates automatically.',
            'Open any order to see line items and full history.',
          ]}
        />
      </div>
    ),
  },
  {
    id: 'sales',
    title: 'Sales orders',
    summary: 'Customer orders from confirmation to fulfillment',
    content: (
      <div className="space-y-3">
        <p>
          <GuideLink to="/sales">Sales Orders</GuideLink> tracks what customers have ordered.
          <GuideLink to="/payments">Payments</GuideLink> and <GuideLink to="/shipments">Shipments</GuideLink> help you follow payment and delivery status.
        </p>
        <StepList
          steps={[
            'Browse open and completed sales orders.',
            'Open an order to see the customer and each line item.',
            'Fulfill an order when ready to ship — stock is reduced automatically.',
          ]}
        />
      </div>
    ),
  },
  {
    id: 'reports',
    title: 'Reports',
    summary: 'Summaries, date filters, and exports',
    content: (
      <div className="space-y-3">
        <p>
          <GuideLink to="/reports">Reports</GuideLink> gives you summary numbers and downloadable data.
          Filter orders by date range, search, and sort — then export inventory to a spreadsheet when needed.
        </p>
        <FeatureList
          items={[
            'Orders report with from / through date filters',
            'Inventory overview with stock levels',
            'Export data for sharing or offline analysis',
          ]}
        />
      </div>
    ),
  },
  {
    id: 'assistant',
    title: 'Smart assistant',
    summary: 'Ask questions about your inventory',
    content: (
      <div className="space-y-3">
        <p>
          Use the floating <strong>Smart Inventory Assistant</strong> button at the bottom-right of any page.
          Ask plain-language questions such as “Which products are low on stock?” or “What might run out soon?”
        </p>
        <p className="text-sm text-gray-500">
          In this demo, answers are sample responses to show how the assistant would work in production.
        </p>
      </div>
    ),
  },
  {
    id: 'notifications',
    title: 'Notifications & activity',
    summary: 'Alerts and a record of what happened',
    content: (
      <div className="space-y-3">
        <p>
          <GuideLink to="/notifications">Notifications</GuideLink> collects low-stock and other alerts.
          Mark items as read when you have handled them. Admins can also send a test email to verify delivery.
        </p>
        <p>
          <GuideLink to="/activity-logs">Activity Logs</GuideLink> shows a history of important actions —
          who signed in, changed stock, or approved an order.
        </p>
      </div>
    ),
  },
  {
    id: 'workflows',
    title: 'Suggested daily workflows',
    summary: 'Simple paths to try in the demo',
    content: (
      <div className="space-y-4">
        <div>
          <p className="font-medium text-gray-800">Manager</p>
          <StepList
            steps={[
              'Check the Dashboard for low stock and pending orders.',
              'Approve purchase orders, then confirm stock after receiving.',
              'Review Reports for summaries or exports.',
            ]}
          />
        </div>
        <div>
          <p className="font-medium text-gray-800">Warehouse team</p>
          <StepList
            steps={[
              'Review Inventory levels and adjust if needed.',
              'Receive approved purchase orders.',
              'Fulfill confirmed sales orders.',
            ]}
          />
        </div>
        <div>
          <p className="font-medium text-gray-800">Sales team</p>
          <StepList
            steps={[
              'Check Listings and Sales Channels for available products.',
              'Manage sales orders and customer details.',
              'Use the assistant for quick stock questions.',
            ]}
          />
        </div>
      </div>
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
          <h2 className="text-base font-semibold text-gray-800">How to use Ventorio</h2>
          <p className="text-sm text-gray-500">
            Plain-language help for every part of the app — no technical setup required.
          </p>
        </div>
      </div>
      <Accordion items={guideSections} defaultOpenId="getting-started" />
    </PageCard>
  );
}
