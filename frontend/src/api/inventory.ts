import type { InventoryAdjust, InventoryItem } from '../types';
import { apiClient } from './client';

export interface InventoryCreate {
  product_id: number;
  quantity: number;
  min_threshold: number;
  location?: string;
}

export async function getInventory(): Promise<InventoryItem[]> {
  const { data } = await apiClient.get<InventoryItem[]>('/inventory');
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
