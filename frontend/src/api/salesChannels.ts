import { apiClient } from './client';

export interface SalesChannelSummary {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  listings_count: number;
  revenue: number;
}

export async function getSalesChannels(): Promise<SalesChannelSummary[]> {
  const { data } = await apiClient.get<SalesChannelSummary[]>('/sales-channels');
  return data;
}

export async function connectProductToChannel(channelId: number, productId: number): Promise<void> {
  await apiClient.post(`/sales-channels/${channelId}/listings`, { product_id: productId });
}

export async function disconnectProductFromChannel(channelId: number, productId: number): Promise<void> {
  await apiClient.delete(`/sales-channels/${channelId}/listings/${productId}`);
}
