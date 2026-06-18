import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import axios from 'axios';
import { ButtonSpinner } from '../components';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DEMO_ACCOUNTS = [
  {
    email: 'admin@inventory.com',
    password: 'admin123',
    label: 'Admin',
    capabilities: [
      'Full access to every module',
      'Manage users, products, inventory, and orders',
      'Create, edit, and delete records',
      'View reports, exports, and AI assistant',
    ],
  },
  {
    email: 'manager@inventory.com',
    password: 'manager123',
    label: 'Manager',
    capabilities: [
      'Manage products, categories, and inventory',
      'Oversee warehouses, suppliers, and purchases',
      'Run stock audits and handle alerts',
      'Access reports, imports, and exports',
    ],
  },
  {
    email: 'warehouse@inventory.com',
    password: 'warehouse123',
    label: 'Warehouse',
    capabilities: [
      'View stock levels and adjust quantities',
      'Receive purchase orders and fulfill sales',
      'Manage transfers and warehouse audits',
      'Read alerts and stock movement history',
    ],
  },
  {
    email: 'sales@inventory.com',
    password: 'sales123',
    label: 'Sales',
    capabilities: [
      'Manage customers and sales orders',
      'View product catalog and available stock',
      'Access sales reports and alerts',
      'Use the AI assistant for insights',
    ],
  },
  {
    email: 'viewer@inventory.com',
    password: 'viewer123',
    label: 'Viewer',
    capabilities: [
      'Read-only access across the platform',
      'Browse products, inventory, and orders',
      'View reports and notifications',
      'No create, edit, or delete actions',
    ],
  },
] as const;

function DemoRoleButton({
  label,
  capabilities,
  disabled,
  onClick,
}: {
  label: string;
  capabilities: readonly string[];
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <div className="group relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        aria-describedby={`demo-role-${label.toLowerCase()}-info`}
        className="whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 transition hover:border-brand hover:bg-brand/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {label}
      </button>
      <div
        id={`demo-role-${label.toLowerCase()}-info`}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-56 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-lg group-hover:block group-focus-within:block"
      >
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand">{label}</p>
        <ul className="space-y-1.5">
          {capabilities.map((item) => (
            <li key={item} className="flex gap-2 text-xs leading-relaxed text-gray-600">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function loginErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Cannot reach the server. Start the backend on port 8000 (./run.sh in backend/).';
    }
    if (error.response.status === 401) {
      return 'Incorrect email or password.';
    }
    if (error.response.status >= 500) {
      return 'Server error — check backend logs and database connection.';
    }
    const detail = error.response.data?.detail;
    if (typeof detail === 'string') return detail;
  }
  return 'Login failed. Please try again.';
}

export function LoginPage() {
  const { user, login, isLoading } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
      showToast('Login successful', 'success');
    } catch (err) {
      showToast(loginErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const quickLogin = async (demoEmail: string, demoPassword: string) => {
    setSubmitting(true);
    try {
      await login(demoEmail, demoPassword);
      showToast('Login successful', 'success');
    } catch (err) {
      showToast(loginErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-xl rounded-lg border border-gray-200 bg-white p-8 shadow-lg">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-sidebar">
            <Package className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-800">Ventorio</h1>
          <p className="text-sm text-gray-500">Sign in to your account</p>
          <span className="mt-2 rounded-full bg-mint px-3 py-0.5 text-xs font-semibold uppercase text-white">
            Demo Environment
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
              placeholder="you@company.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded bg-brand py-2.5 font-medium text-white shadow-sm hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <ButtonSpinner />}
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6">
          <p className="mb-2 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
            Quick demo login
          </p>
          <p className="mb-3 text-center text-xs text-gray-400">
            Hover a role to see what it can do, then click to sign in
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-1">
            {DEMO_ACCOUNTS.map((account) => (
              <DemoRoleButton
                key={account.email}
                label={account.label}
                capabilities={account.capabilities}
                disabled={submitting}
                onClick={() => quickLogin(account.email, account.password)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
