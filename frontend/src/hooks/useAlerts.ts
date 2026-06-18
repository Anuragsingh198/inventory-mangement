import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAlerts, markAlertRead } from '../api/reports';

export function useAlerts(unreadOnly = true) {
  return useQuery({
    queryKey: ['alerts', unreadOnly],
    queryFn: () => getAlerts(unreadOnly),
  });
}

export function useAlertMutations() {
  const queryClient = useQueryClient();

  const markRead = useMutation({
    mutationFn: (id: number) => markAlertRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  return { markRead };
}
