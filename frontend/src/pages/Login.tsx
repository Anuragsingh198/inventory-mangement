import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

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
      await login(email, password);
      showToast('Login successful', 'success');
    } catch {
      showToast('Invalid email or password', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-lg">
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
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
              placeholder="admin@inventory.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-gray-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-brand py-2.5 font-medium text-white shadow-sm hover:bg-brand-dark disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 space-y-1 text-center text-xs text-gray-400">
          <p className="font-medium text-gray-500">Demo accounts</p>
          <p>admin@inventory.com / admin123(can access all modules)</p>
          <p>manager@inventory.com / manager123(can access inventory management and sales management)</p>
          <p>warehouse@inventory.com / warehouse123(can access warehouse management)</p>
          <p>sales@inventory.com / sales123(can access sales management)</p>
          <p>viewer@inventory.com / viewer123(can access inventory management and sales management)</p>
        </div>
      </div>
    </div>
  );
}
