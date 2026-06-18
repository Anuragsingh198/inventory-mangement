import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createOrder, deleteOrder, getOrders, updateOrder, updateOrderStatus, type OrderSort } from '../api/orders';
import { PAGE_SIZE } from '../lib/utils';
import type { ListQueryOptions, OrderCreate, OrderStatus } from '../types';

export function useOrders(
  status?: OrderStatus,
  startDate?: string,
  endDate?: string,
  search?: string,
  options: ListQueryOptions & { sort?: OrderSort } = {},
) {
  const page = options.page ?? 1;
  const pageSize = options.all ? 0 : (options.pageSize ?? PAGE_SIZE);
  const sort = options.sort ?? 'newest';

  return useQuery({
    queryKey: ['orders', status, startDate, endDate, search, sort, options.all ? 'all' : page, pageSize],
    queryFn: () => getOrders(status, startDate, endDate, search, page, pageSize, options.all, sort),
    placeholderData: keepPreviousData,
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
