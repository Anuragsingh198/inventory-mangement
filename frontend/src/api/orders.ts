import type { Order, OrderCreate, OrderStatus, Paginated } from '../types';
import { PAGE_SIZE } from '../lib/utils';
import { apiClient } from './client';

export type OrderSort = 'newest' | 'oldest' | 'customer';

export async function getOrder(id: number): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/orders/${id}`);
  return data;
}

export async function getOrders(
  status?: OrderStatus,
  startDate?: string,
  endDate?: string,
  search?: string,
  page = 1,
  pageSize = PAGE_SIZE,
  all = false,
  sort: OrderSort = 'newest',
): Promise<Paginated<Order>> {
  const params: Record<string, string | number> = {
    page,
    page_size: all ? 0 : pageSize,
    sort,
  };
  if (status) params.status = status;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  if (search) params.search = search;
  const { data } = await apiClient.get<Paginated<Order>>('/orders', { params });
  return data;
}

export async function createOrder(order: OrderCreate): Promise<Order> {
  const { data } = await apiClient.post<Order>('/orders', order);
  return data;
}

export async function updateOrder(
  id: number,
  data: { notes?: string; supplier?: string; status?: OrderStatus },
): Promise<Order> {
  const { data: order } = await apiClient.patch<Order>(`/orders/${id}`, data);
  return order;
}

export async function updateOrderStatus(id: number, status: OrderStatus): Promise<Order> {
  const { data } = await apiClient.patch<Order>(`/orders/${id}`, { status });
  return data;
}

export async function deleteOrder(id: number): Promise<void> {
  await apiClient.delete(`/orders/${id}`);
}
