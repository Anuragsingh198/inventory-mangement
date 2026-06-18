import type { Order, OrderCreate, OrderStatus } from '../types';
import { apiClient } from './client';

export async function getOrder(id: number): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/orders/${id}`);
  return data;
}

export async function getOrders(status?: OrderStatus, startDate?: string, endDate?: string): Promise<Order[]> {
  const params: Record<string, string> = {};
  if (status) params.status = status;
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  const { data } = await apiClient.get<Order[]>('/orders', { params });
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
