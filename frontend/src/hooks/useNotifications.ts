import { useMutation, useQuery } from '@tanstack/react-query';
import { getEmailConfig, sendTestEmail } from '../api/notifications';

export function useEmailConfig() {
  return useQuery({ queryKey: ['email-config'], queryFn: getEmailConfig });
}

export function useNotificationMutations() {
  return {
    sendTestEmail: useMutation({ mutationFn: (to?: string) => sendTestEmail(to) }),
  };
}
