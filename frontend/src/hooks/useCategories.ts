import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCategory } from '../api/products';

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (data: { name: string; description?: string }) => createCategory(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  return { create };
}
