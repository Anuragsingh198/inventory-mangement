import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProduct, deleteProduct, getCategories, getProducts, updateProduct } from '../api/products';
import type { ProductCreate } from '../types';

export function useProducts(search?: string, categoryId?: number) {
  return useQuery({
    queryKey: ['products', search, categoryId],
    queryFn: () => getProducts(search, categoryId),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
}

export function useProductMutations() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (product: ProductCreate) => createProduct(product),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductCreate> }) => updateProduct(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  return { create, update, remove };
}
