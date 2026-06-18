import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adjustInventory,
  createInventory,
  deleteInventory,
  getInventory,
  getLowStock,
  updateInventory,
  type InventoryCreate,
} from '../api/inventory';
import type { InventoryAdjust } from '../types';

export function useInventory() {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: getInventory,
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
