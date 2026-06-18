import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  updateProduct,
  type ProductSort,
} from '../api/products';
import { PAGE_SIZE } from '../lib/utils';
import type { ListQueryOptions, ProductCreate } from '../types';

export function useProducts(
  search?: string,
  categoryId?: number,
  sort: ProductSort = 'name',
  options: ListQueryOptions = {},
) {
  const page = options.page ?? 1;
  const pageSize = options.all ? 0 : (options.pageSize ?? PAGE_SIZE);

  return useQuery({
    queryKey: ['products', search, categoryId, sort, options.all ? 'all' : page, pageSize],
    queryFn: () => getProducts(search, categoryId, sort, page, pageSize, options.all),
    placeholderData: keepPreviousData,
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
