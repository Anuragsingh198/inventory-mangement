import type { ReportSummary, StockAlert } from '../types';
import { apiClient } from './client';

export async function getReportSummary(): Promise<ReportSummary> {
  const { data } = await apiClient.get<ReportSummary>('/reports/summary');
  return data;
}

export async function exportInventory(): Promise<Blob> {
  const { data } = await apiClient.get<Blob>('/reports/export', { responseType: 'blob' });
  return data;
}

export async function getAlerts(unreadOnly = true): Promise<StockAlert[]> {
  const { data } = await apiClient.get<StockAlert[]>('/alerts', { params: { unread_only: unreadOnly } });
  return data;
}

export async function markAlertRead(id: number): Promise<StockAlert> {
  const { data } = await apiClient.patch<StockAlert>(`/alerts/${id}/read`);
  return data;
}
