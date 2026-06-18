import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adjustInventory,
  createInventory,
  deleteInventory,
  getInventory,
  getLowStock,
  updateInventory,
  type InventoryCreate,
  type InventorySort,
} from '../api/inventory';
import { PAGE_SIZE } from '../lib/utils';
import type { InventoryAdjust, ListQueryOptions } from '../types';

export function useInventory(
  search?: string,
  options: ListQueryOptions & { sort?: InventorySort } = {},
) {
  const page = options.page ?? 1;
  const pageSize = options.all ? 0 : (options.pageSize ?? PAGE_SIZE);
  const sort = options.sort ?? 'id';

  return useQuery({
    queryKey: ['inventory', search, options.all ? 'all' : page, pageSize, sort],
    queryFn: () => getInventory(search, page, pageSize, options.all, sort),
    placeholderData: keepPreviousData,
  });
}

export function useLowStock() {
  return useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: getLowStock,
  });
}

export function useInventoryMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['alerts'] });
    queryClient.invalidateQueries({ queryKey: ['reports'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const adjust = useMutation({
    mutationFn: ({ id, data }: { id: number; data: InventoryAdjust }) => adjustInventory(id, data),
    onSuccess: invalidate,
  });

  const create = useMutation({
    mutationFn: (data: InventoryCreate) => createInventory(data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateInventory>[1] }) =>
      updateInventory(id, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteInventory(id),
    onSuccess: invalidate,
  });

  return { adjust, create, update, remove };
}
