import type { InventoryAdjust, InventoryItem, Paginated } from '../types';
import { PAGE_SIZE } from '../lib/utils';
import { apiClient } from './client';

export interface InventoryCreate {
  product_id: number;
  quantity: number;
  min_threshold: number;
  location?: string;
}

export type InventorySort = 'id' | 'name' | 'sku' | 'quantity' | 'location';

export async function getInventory(
  search?: string,
  page = 1,
  pageSize = PAGE_SIZE,
  all = false,
  sort: InventorySort = 'id',
): Promise<Paginated<InventoryItem>> {
  const params: Record<string, string | number> = {
    page,
    page_size: all ? 0 : pageSize,
    sort,
  };
  if (search) params.search = search;
  const { data } = await apiClient.get<Paginated<InventoryItem>>('/inventory', { params });
  return data;
}

export async function getLowStock(): Promise<InventoryItem[]> {
  const { data } = await apiClient.get<InventoryItem[]>('/inventory/low-stock');
  return data;
}

export async function createInventory(data: InventoryCreate): Promise<InventoryItem> {
  const { data: item } = await apiClient.post<InventoryItem>('/inventory', data);
  return item;
}

export async function deleteInventory(id: number): Promise<void> {
  await apiClient.delete(`/inventory/${id}`);
}

export async function adjustInventory(id: number, adjustment: InventoryAdjust): Promise<InventoryItem> {
  const { data } = await apiClient.post<InventoryItem>(`/inventory/${id}/adjust`, adjustment);
  return data;
}

export async function updateInventory(
  id: number,
  updates: Partial<Pick<InventoryItem, 'quantity' | 'min_threshold' | 'location'>>,
): Promise<InventoryItem> {
  const { data } = await apiClient.patch<InventoryItem>(`/inventory/${id}`, updates);
  return data;
}
