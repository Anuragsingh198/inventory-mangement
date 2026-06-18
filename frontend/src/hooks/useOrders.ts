import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createOrder, deleteOrder, getOrders, updateOrder, updateOrderStatus } from '../api/orders';
import type { OrderCreate, OrderStatus } from '../types';

export function useOrders(status?: OrderStatus, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['orders', status, startDate, endDate],
    queryFn: () => getOrders(status, startDate, endDate),
  });
}

export function useOrderMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['reports'] });
  };

  const create = useMutation({
    mutationFn: (order: OrderCreate) => createOrder(order),
    onSuccess: invalidate,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) => updateOrderStatus(id, status),
    onSuccess: (_, { id }) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { notes?: string; supplier?: string } }) =>
      updateOrder(id, data),
    onSuccess: (_, { id }) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteOrder(id),
    onSuccess: invalidate,
  });

  return { create, updateStatus, update, remove };
}
