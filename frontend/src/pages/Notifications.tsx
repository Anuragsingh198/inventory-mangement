import { AlertItem, ErrorState, LoadingSkeleton, OutlineButton, PageCard, PageHeader, Pagination } from '../components';
import { useAlertMutations, useAlerts } from '../hooks/useAlerts';
import { usePagination } from '../hooks/usePagination';
import { useEmailConfig, useNotificationMutations } from '../hooks/useNotifications';
import { canWrite } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePageSize } from '../context/PageSizeContext';
import { useToast } from '../context/ToastContext';
import { PAGE_DESCRIPTIONS } from '../lib/pageMeta';

export function NotificationsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { data: alerts, isLoading, error } = useAlerts(false);
  const { data: emailConfig } = useEmailConfig();
  const { markRead } = useAlertMutations();
  const { sendTestEmail } = useNotificationMutations();
  const { pageSize } = usePageSize();
  const { page, pages, paged, setPage, total } = usePagination(alerts ?? [], 'notifications', pageSize);

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message="Failed to load notifications" />;

  const unread = alerts?.filter((a) => !a.is_read) ?? [];

  const handleTestEmail = async () => {
    try {
      const result = await sendTestEmail.mutateAsync(undefined);
      showToast(`Test email sent to ${result.to}`, 'success');
    } catch {
      showToast('Failed to send test email — check Resend config in backend/.env', 'error');
    }
  };

  return (
    <div>
      <PageHeader title="Notifications" description={PAGE_DESCRIPTIONS.notifications} />
      {canWrite(user?.role) && emailConfig && (
        <PageCard className="mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Email alerts (Resend)</p>
              <p className="text-xs text-gray-500">
                {emailConfig.configured
                  ? `From ${emailConfig.from_email} → ${emailConfig.recipients.join(', ') || 'admin users'}`
                  : 'RESEND_API_KEY not set — in-app alerts still work'}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Low-stock emails send automatically when stock drops below threshold.
              </p>
            </div>
            {emailConfig.configured && (
              <OutlineButton loading={sendTestEmail.isPending} onClick={handleTestEmail}>
                Send test email
              </OutlineButton>
            )}
          </div>
        </PageCard>
      )}
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
              markReadLoading={markRead.isPending && markRead.variables === alert.id}
              onMarkRead={!alert.is_read ? () => markRead.mutate(alert.id) : undefined}
            />
          ))}
        </div>
        <Pagination page={page} total={pages} onChange={setPage} totalItems={total} />
      </PageCard>
    </div>
  );
}
