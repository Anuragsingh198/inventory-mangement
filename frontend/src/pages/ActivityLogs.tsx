import { ErrorState, LoadingSkeleton, PageCard, PageHeader, Pagination, Table } from '../components';
import { useActivityLogs } from '../hooks/useEnterprise';
import { usePagination } from '../hooks/usePagination';
import { formatDate, PAGE_SIZE } from '../lib/utils';

export function ActivityLogsPage() {
  const { data, isLoading, error } = useActivityLogs();
  const { page, pages, paged, setPage, total } = usePagination(data ?? [], 'activity-logs');

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState message="Failed to load activity logs" />;

  return (
    <div>
      <PageHeader title="Activity Logs" />
      <PageCard>
        <Table headers={['Action', 'Entity', 'User', 'Time']}>
          {paged.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50/50">
              <td className="px-4 py-4 text-sm font-medium">{log.action}</td>
              <td className="px-4 py-4 text-sm">{log.entity_type}{log.entity_id ? ` #${log.entity_id}` : ''}</td>
              <td className="px-4 py-4 text-sm">{log.user_id ? `#${log.user_id}` : 'System'}</td>
              <td className="px-4 py-4 text-sm text-gray-500">{formatDate(log.created_at)}</td>
            </tr>
          ))}
        </Table>
        <Pagination page={page} total={pages} onChange={setPage} totalItems={total} perPage={PAGE_SIZE} />
      </PageCard>
    </div>
  );
}
