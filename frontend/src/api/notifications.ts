import { apiClient } from './client';

export interface EmailConfig {
  configured: boolean;
  from_email: string;
  recipients: string[];
  provider: string;
}

export const getEmailConfig = () =>
  apiClient.get<EmailConfig>('/notifications/email-config').then((r) => r.data);

export const sendTestEmail = (to?: string) =>
  apiClient.post<{ ok: boolean; to: string; error?: string }>('/notifications/test-email', { to }).then((r) => r.data);
