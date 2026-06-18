import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Pencil, Star, Trash2 } from 'lucide-react';
import { usePageSize } from '../context/PageSizeContext';

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
  id,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  id?: string;
}) {
  return (
    <div id={id} className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      <div className={padded ? 'p-5' : undefined}>{children}</div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
  showDate?: boolean;
  backTo?: { label: string; path: string };
}

export function PageHeader({
  title,
  description,
  action,
  showDate = true,
  backTo,
}: PageHeaderProps) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-sidebar via-[#2a5a8a] to-brand p-6 text-white shadow-lg sm:p-8">
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-48 w-48 rounded-full bg-mint/20 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          {backTo && (
            <Link
              to={backTo.path}
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-white/80 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {backTo.label}
            </Link>
          )}
          {showDate && (
            <p className="text-sm font-medium text-white/70">{today}</p>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">{description}</p>
        </div>
        {action && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>
        )}
      </div>
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

export function ButtonSpinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-3 w-3 border' : 'h-4 w-4 border-2';
  return (
    <span
      className={`inline-block shrink-0 animate-spin rounded-full border-current border-t-transparent ${sizeClass}`}
      aria-hidden
    />
  );
}

/** Keeps filters visible; shows loading overlay only over the table area. */
export function TableArea({
  loading,
  children,
  className = '',
}: {
  loading?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/70 backdrop-blur-[1px]"
          aria-live="polite"
          aria-busy="true"
        >
          <ButtonSpinner />
        </div>
      )}
      {children}
    </div>
  );
}

type ActionButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
};

export function PrimaryButton({
  children,
  onClick,
  className = '',
  loading = false,
  disabled = false,
  type = 'button',
}: ActionButtonProps) {
  const isDisabled = loading || disabled;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${className}`}
    >
      {loading && <ButtonSpinner />}
      {children}
    </button>
  );
}

export function OutlineButton({
  children,
  onClick,
  className = '',
  loading = false,
  disabled = false,
  type = 'button',
}: ActionButtonProps) {
  const isDisabled = loading || disabled;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${className}`}
    >
      {loading && <ButtonSpinner />}
      {children}
    </button>
  );
}

/** Primary CTA on gradient PageHeader banners */
export function HeaderButton({
  children,
  onClick,
  className = '',
  loading = false,
  disabled = false,
  type = 'button',
}: ActionButtonProps) {
  const isDisabled = loading || disabled;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-sidebar shadow-md transition hover:bg-white/95 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${className}`}
    >
      {loading && <ButtonSpinner />}
      {children}
    </button>
  );
}

/** Secondary action on gradient PageHeader banners */
export function HeaderOutlineButton({
  children,
  onClick,
  className = '',
  loading = false,
  disabled = false,
  type = 'button',
}: ActionButtonProps) {
  const isDisabled = loading || disabled;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:border-white/45 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${className}`}
    >
      {loading && <ButtonSpinner />}
      {children}
    </button>
  );
}

/** Icon-only action on gradient PageHeader banners */
export function HeaderIconButton({
  children,
  onClick,
  className = '',
  loading = false,
  disabled = false,
  title,
  'aria-label': ariaLabel,
}: Omit<ActionButtonProps, 'type'> & {
  title?: string;
  'aria-label'?: string;
}) {
  const isDisabled = loading || disabled;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
      title={title}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 p-2.5 text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${className}`}
    >
      {loading ? <ButtonSpinner size="sm" /> : children}
    </button>
  );
}

export function DangerButton({
  children,
  onClick,
  className = '',
  loading = false,
  disabled = false,
  type = 'button',
}: ActionButtonProps) {
  const isDisabled = loading || disabled;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
    >
      {loading && <ButtonSpinner />}
      {children}
    </button>
  );
}

export function InlineActionButton({
  children,
  onClick,
  className = '',
  loading = false,
  disabled = false,
}: Omit<ActionButtonProps, 'type'>) {
  const isDisabled = loading || disabled;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
      className={`inline-flex items-center gap-1.5 text-brand hover:underline disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading && <ButtonSpinner size="sm" />}
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
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
  totalItems?: number;
}) {
  const { pageSize, setPageSize, options } = usePageSize();
  const pageNumbers = getPageNumbers(page, total);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size as (typeof options)[number]);
    onChange(1);
  };

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
        {totalItems !== undefined && totalItems > 0 && (
          <span>
            {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          Rows per page
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-700"
            aria-label="Rows per page"
          >
            {options.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
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
  subtitle?: string;
  trend?: { label: string; positive?: boolean };
  onClick?: () => void;
}

const STAT_ACCENTS = {
  blue: {
    icon: 'bg-sky-50 text-brand',
    ring: 'hover:ring-brand/30',
    gradient: 'from-brand/5 to-white',
  },
  mint: {
    icon: 'bg-teal-50 text-mint-dark',
    ring: 'hover:ring-mint/40',
    gradient: 'from-mint/10 to-white',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600',
    ring: 'hover:ring-amber-300/50',
    gradient: 'from-amber-50/80 to-white',
  },
  navy: {
    icon: 'bg-slate-100 text-sidebar',
    ring: 'hover:ring-sidebar/30',
    gradient: 'from-sidebar/5 to-white',
  },
};

export function StatCard({ title, value, icon, accent = 'blue', subtitle, trend, onClick }: StatCardProps) {
  const styles = STAT_ACCENTS[accent];
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group relative min-w-0 overflow-hidden rounded-xl border border-gray-200/80 bg-gradient-to-br ${styles.gradient} p-5 text-left shadow-sm transition-all duration-200 ${
        onClick ? `cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:ring-2 ${styles.ring}` : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
          <p
            className="mt-2 truncate text-xl font-bold tabular-nums tracking-tight text-gray-900 sm:text-2xl xl:text-3xl"
            title={String(value)}
          >
            {value}
          </p>
          {subtitle && <p className="mt-1 truncate text-xs text-gray-500">{subtitle}</p>}
          {trend && (
            <p className={`mt-2 truncate text-xs font-medium ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend.label}
            </p>
          )}
        </div>
        <div className={`shrink-0 rounded-xl p-3 shadow-sm transition-transform group-hover:scale-105 ${styles.icon}`}>
          {icon}
        </div>
      </div>
    </Wrapper>
  );
}

export function AlertItem({
  message,
  type,
  createdAt,
  onMarkRead,
  markReadLoading = false,
}: {
  message: string;
  type: string;
  createdAt: string;
  onMarkRead?: () => void;
  markReadLoading?: boolean;
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
        <InlineActionButton onClick={onMarkRead} loading={markReadLoading} disabled={markReadLoading}>
          Mark read
        </InlineActionButton>
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

function FilterClearLink({ visible, onClear }: { visible: boolean; onClear: () => void }) {
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={onClear}
      className="shrink-0 text-xs font-medium text-gray-400 hover:text-brand"
    >
      Clear
    </button>
  );
}

function FilterLabelRow({
  label,
  showClear,
  onClear,
}: {
  label: string;
  showClear: boolean;
  onClear: () => void;
}) {
  return (
    <div className="mb-1 flex items-center justify-between gap-2">
      <label className="text-xs text-gray-500">{label}</label>
      <FilterClearLink visible={showClear} onClear={onClear} />
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
  className = '',
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}) {
  const inputClassName = label
    ? 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30'
    : 'min-w-0 flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30';

  const input = (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputClassName}
    />
  );

  if (label) {
    return (
      <div className={className}>
        <FilterLabelRow label={label} showClear={Boolean(value)} onClear={() => onChange('')} />
        {input}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {input}
      <FilterClearLink visible={Boolean(value)} onClear={() => onChange('')} />
    </div>
  );
}

export function FilterInput({
  value,
  onChange,
  placeholder,
  className = '',
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
}) {
  return (
    <SearchInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      label={label}
    />
  );
}

export function SortSelect({
  value,
  onChange,
  options,
  label,
  defaultValue,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  defaultValue?: string;
  className?: string;
}) {
  const fallback = defaultValue ?? options[0]?.value ?? '';
  const showClear = value !== fallback;

  const select = (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={
        label
          ? 'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900'
          : 'min-w-0 flex-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800'
      }
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );

  if (label) {
    return (
      <div className={className}>
        <FilterLabelRow label={label} showClear={showClear} onClear={() => onChange(fallback)} />
        {select}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {select}
      <FilterClearLink visible={showClear} onClear={() => onChange(fallback)} />
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'All',
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <FilterLabelRow label={label} showClear={Boolean(value)} onClear={() => onChange('')} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export function DateFilterInput({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="text-xs text-gray-500">{label}</label>
        <FilterClearLink visible={Boolean(value)} onClear={() => onChange('')} />
      </div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
      />
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

export function Accordion({
  items,
  defaultOpenId,
}: {
  items: { id: string; title: string; summary?: string; content: ReactNode }[];
  defaultOpenId?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);

  return (
    <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50/80"
            >
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                {item.summary && !isOpen && (
                  <p className="mt-0.5 text-xs text-gray-500">{item.summary}</p>
                )}
              </div>
              <ChevronDown
                className={`mt-0.5 h-4 w-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && (
              <div className="border-t border-gray-100 px-4 py-3 text-sm leading-relaxed text-gray-600">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
