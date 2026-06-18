import type { Category, Paginated, Product, ProductCreate } from '../types';
import { PAGE_SIZE } from '../lib/utils';
import { apiClient } from './client';

export type ProductSort = 'name' | 'price' | 'quantity';

export async function getProducts(
  search?: string,
  categoryId?: number,
  sort: ProductSort = 'name',
  page = 1,
  pageSize = PAGE_SIZE,
  all = false,
): Promise<Paginated<Product>> {
  const params: Record<string, string | number> = {
    sort,
    page,
    page_size: all ? 0 : pageSize,
  };
  if (search) params.search = search;
  if (categoryId) params.category_id = categoryId;
  const { data } = await apiClient.get<Paginated<Product>>('/products', { params });
  return data;
}

export async function createProduct(product: ProductCreate): Promise<Product> {
  const { data } = await apiClient.post<Product>('/products', product);
  return data;
}

export async function updateProduct(id: number, product: Partial<ProductCreate>): Promise<Product> {
  const { data } = await apiClient.patch<Product>(`/products/${id}`, product);
  return data;
}

export async function deleteProduct(id: number): Promise<void> {
  await apiClient.delete(`/products/${id}`);
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<Category[]>('/categories');
  return data;
}

export async function createCategory(category: { name: string; description?: string }): Promise<Category> {
  const { data } = await apiClient.post<Category>('/categories', category);
  return data;
}

export async function updateCategory(id: number, category: Partial<Category>): Promise<Category> {
  const { data } = await apiClient.patch<Category>(`/categories/${id}`, category);
  return data;
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}
