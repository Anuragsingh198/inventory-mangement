import { AlertItem, ErrorState, LoadingSkeleton, PageCard, PageHeader, Pagination } from '../components';
import { useAlertMutations, useAlerts } from '../hooks/useAlerts';
import { usePagination } from '../hooks/usePagination';
import { PAGE_SIZE } from '../lib/utils';

export function NotificationsPage() {
  const { data: alerts, isLoading, error } = useAlerts(false);
  const { markRead } = useAlertMutations();
  const { page, pages, paged, setPage, total } = usePagination(alerts ?? [], 'notifications');

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message="Failed to load notifications" />;

  const unread = alerts?.filter((a) => !a.is_read) ?? [];

  return (
    <div>
      <PageHeader title="Notifications" />
      <PageCard>
        {unread.length > 0 && (
          <p className="mb-4 text-sm text-gray-500">{unread.length} unread notification(s)</p>
        )}
        <div className="space-y-3">
          {total === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">No notifications</p>
          )}
          {paged.map((alert) => (
            <AlertItem
              key={alert.id}
              message={alert.message}
              type={alert.alert_type}
              createdAt={alert.created_at}
              onMarkRead={!alert.is_read ? () => markRead.mutate(alert.id) : undefined}
            />
          ))}
        </div>
        <Pagination page={page} total={pages} onChange={setPage} totalItems={total} perPage={PAGE_SIZE} />
      </PageCard>
    </div>
  );
}
