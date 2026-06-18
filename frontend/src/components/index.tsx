import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Star, Trash2 } from 'lucide-react';

interface TableProps {
  headers: string[];
  children: ReactNode;
  filterRow?: ReactNode;
}

export function Table({ headers, children, filterRow }: TableProps) {
  return (
    <div className="overflow-x-auto table-row-hover">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50/80 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
            {headers.map((header) => (
              <th key={header} className="px-4 py-3">
                {header}
              </th>
            ))}
          </tr>
          {filterRow && (
            <tr className="border-b border-gray-200 bg-white">
              {filterRow}
            </tr>
          )}
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">{children}</tbody>
      </table>
    </div>
  );
}

export function TableFilterCell({ children, colSpan }: { children: ReactNode; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className="px-3 py-2">
      {children}
    </td>
  );
}

export function PageCard({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      <div className={padded ? 'p-5' : undefined}>{children}</div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  action?: ReactNode;
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      {action}
    </div>
  );
}

const TAB_COLORS = ['bg-brand', 'bg-mint', 'bg-accent-amber', 'bg-gray-400', 'bg-sidebar'] as const;

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-3">
      {tabs.map((tab, index) => {
        const isActive = active === tab.id;
        const badgeColor = TAB_COLORS[index % TAB_COLORS.length];
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2.5 rounded border px-4 py-2.5 text-sm transition-all ${
              isActive
                ? 'border-brand/40 bg-sky-50/60 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border ${
                isActive ? 'border-brand bg-brand' : 'border-gray-300 bg-white'
              }`}
            >
              {isActive && (
                <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span className={`font-medium ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`rounded px-2 py-0.5 text-xs font-bold text-white ${badgeColor}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-dark ${className}`}
    >
      {children}
    </button>
  );
}

export function OutlineButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;
  const sizeClass = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={`relative w-full ${sizeClass} rounded-lg border border-gray-200 bg-white p-6 shadow-xl`}>
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-sky-50 text-sky-700',
    brand: 'bg-sky-50 text-brand',
  };
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function ChannelLink({ name }: { name: string }) {
  return (
    <span className="cursor-pointer text-sm text-brand hover:underline">{name}</span>
  );
}

export function RowActions({
  onEdit,
  onDelete,
  onStar,
  starred = false,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  onStar?: () => void;
  starred?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 text-gray-400">
      {onStar && (
        <button type="button" onClick={onStar} className={starred ? 'text-accent-amber' : 'hover:text-accent-amber'}>
          <Star className={`h-4 w-4 ${starred ? 'fill-accent-amber text-accent-amber' : ''}`} />
        </button>
      )}
      {onEdit && (
        <button type="button" onClick={onEdit} className="hover:text-brand">
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={onDelete} className="hover:text-red-500">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export function Pagination({
  page,
  total,
  onChange,
  totalItems,
  perPage = 10,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
  totalItems?: number;
  perPage?: number;
}) {
  const pageNumbers = getPageNumbers(page, total);

  return (
    <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
      {total > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
            className="rounded border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageNumbers.map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-gray-400">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onChange(p)}
                className={`min-w-8 rounded border px-2 py-1 text-sm font-medium ${
                  p === page
                    ? 'border-brand bg-brand text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            disabled={page >= total}
            onClick={() => onChange(page + 1)}
            className="rounded border border-gray-200 bg-white p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-500">
        {totalItems !== undefined && (
          <span>
            {(page - 1) * perPage + 1}–{Math.min(page * perPage, totalItems)} of {totalItems}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          Rows per page
          <select
            defaultValue={perPage}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700"
            disabled
          >
            <option value={10}>10</option>
          </select>
        </span>
      </div>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const result: (number | 'ellipsis')[] = [1];

  if (current > 3) result.push('ellipsis');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    result.push(i);
  }

  if (current < total - 2) result.push('ellipsis');

  result.push(total);
  return result;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  accent?: 'blue' | 'mint' | 'amber' | 'navy';
}

const STAT_ACCENTS = {
  blue: 'bg-sky-50 text-brand',
  mint: 'bg-teal-50 text-mint-dark',
  amber: 'bg-amber-50 text-amber-600',
  navy: 'bg-slate-100 text-sidebar',
};

export function StatCard({ title, value, icon, accent = 'blue' }: StatCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <div className={`rounded-lg p-3 ${STAT_ACCENTS[accent]}`}>{icon}</div>
      </div>
    </div>
  );
}

export function AlertItem({
  message,
  type,
  createdAt,
  onMarkRead,
}: {
  message: string;
  type: string;
  createdAt: string;
  onMarkRead?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
      <div>
        <Badge variant={type === 'out_of_stock' ? 'danger' : 'warning'}>
          {type.replace('_', ' ')}
        </Badge>
        <p className="mt-2 text-sm text-gray-800">{message}</p>
        <p className="mt-1 text-xs text-gray-500">{new Date(createdAt).toLocaleString()}</p>
      </div>
      {onMarkRead && (
        <button type="button" onClick={onMarkRead} className="text-xs font-medium text-brand hover:underline">
          Mark read
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
}

export function LoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{message}</div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 ${className}`}
    />
  );
}

export function SortSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

export function FilterInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-brand"
    />
  );
}
