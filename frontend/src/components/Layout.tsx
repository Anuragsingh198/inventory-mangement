import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  List,
  LogOut,
  Menu,
  Network,
  Package,
  Settings,
  ShoppingCart,
  Warehouse,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAlerts } from '../hooks/useAlerts';

const navItems: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  children?: { to: string; label: string }[];
}[] = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    children: [
      { to: '/dashboard', label: 'Overview' },
      { to: '/reports', label: 'Reports' },
      { to: '/ai-assistant', label: 'AI Assistant' },
    ],
  },
  { to: '/listings', label: 'Listings', icon: List },
  {
    to: '/inventory',
    label: 'Inventory',
    icon: Warehouse,
    children: [
      { to: '/inventory', label: 'Stock Levels' },
      { to: '/warehouses', label: 'Warehouses' },
    ],
  },
  {
    to: '/suppliers',
    label: 'Procurement',
    icon: Building2,
    children: [
      { to: '/suppliers', label: 'Suppliers' },
      { to: '/purchases', label: 'Purchase Orders' },
      { to: '/orders', label: 'Legacy Orders' },
    ],
  },
  {
    to: '/sales',
    label: 'Sales',
    icon: ShoppingCart,
    children: [
      { to: '/sales', label: 'Sales Orders' },
      { to: '/payments', label: 'Payments' },
      { to: '/shipments', label: 'Shipments' },
    ],
  },
  { to: '/sales-channels', label: 'Sales Channels', icon: Network },
  {
    to: '/notifications',
    label: 'Notifications',
    icon: Bell,
    children: [
      { to: '/notifications', label: 'Alerts' },
      { to: '/activity-logs', label: 'Activity Logs' },
    ],
  },
];

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: alerts } = useAlerts(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === 'true');
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState<string | null>('/dashboard');

  const unreadCount = alerts?.length ?? 0;
  const displayName = user?.email?.split('@')[0] ?? user?.full_name ?? 'User';

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const isSectionActive = (path: string, children?: { to: string }[]) => {
    if (isActive(path)) return true;
    return children?.some((c) => isActive(c.to)) ?? false;
  };

  useEffect(() => setSidebarOpen(false), [location.pathname]);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const match = navItems.find((item) => isSectionActive(item.to, item.children));
    if (match?.children) setExpandedNav(match.to);
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 flex-col bg-sidebar text-white shadow-xl transition-all duration-200 lg:relative lg:translate-x-0 ${
          collapsed ? 'w-[68px]' : 'w-60'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className={`shrink-0 flex items-center border-b border-white/10 ${collapsed ? 'justify-center px-2 py-4' : 'justify-between px-4 py-4'}`}>
          <Link to="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <Package className="h-5 w-5 text-white" />
            </div>
            {!collapsed && <span className="truncate text-lg font-semibold tracking-tight">Ventorio</span>}
          </Link>
          <button type="button" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={`hidden shrink-0 border-b border-white/10 lg:flex ${collapsed ? 'justify-center p-2' : 'justify-end px-3 py-2'}`}>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="rounded p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {navItems.map(({ to, label, icon: Icon, children }) => {
            const sectionActive = isSectionActive(to, children);
            const hasChildren = children && children.length > 0 && !collapsed;

            return (
              <div key={to}>
                <div className="flex items-center">
                  <Link
                    to={to}
                    title={collapsed ? label : undefined}
                    onClick={() => children && setExpandedNav(expandedNav === to ? null : to)}
                    className={`flex flex-1 items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      sectionActive
                        ? 'bg-white/15 text-white'
                        : 'text-white/75 hover:bg-sidebar-hover hover:text-white'
                    } ${collapsed ? 'justify-center px-2' : ''}`}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                  {hasChildren && (
                    <button
                      type="button"
                      onClick={() => setExpandedNav(expandedNav === to ? null : to)}
                      className="mr-1 rounded p-1 text-white/60 hover:text-white"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedNav === to ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>

                {hasChildren && expandedNav === to && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/15 pl-3">
                    {children.map((child) => (
                      <Link
                        key={child.to}
                        to={child.to}
                        className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                          isActive(child.to)
                            ? 'bg-mint/20 font-medium text-mint'
                            : 'text-white/65 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="shrink-0 border-t border-white/10 px-4 py-3 text-xs text-white/50">
            Inventory Management
          </div>
        )}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-30 flex shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
          <button type="button" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6 text-gray-600" />
          </button>

          <span className="rounded-full bg-mint px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
            Demo Environment
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/sales-channels')}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-sidebar"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
            <Link
              to="/notifications"
              className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-sidebar"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-lg border border-gray-100 px-2 py-1 hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar text-sm font-semibold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium capitalize text-gray-800">{displayName}</p>
                  <p className="text-xs capitalize text-gray-400">{user?.role}</p>
                </div>
                <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setProfileOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>

        <footer className="flex shrink-0 items-center justify-between border-t border-gray-200 bg-white px-6 py-2.5 text-xs text-gray-400">
          <span>Created in 2026</span>
          <span>Version: 1.0</span>
        </footer>
      </div>
    </div>
  );
}
