import type { Paginated } from '../types';
import { PAGE_SIZE } from '../lib/utils';
import { apiClient } from './client';
import type {
  Supplier,
  Customer,
  PurchaseOrder,
  SalesOrder,
  Warehouse,
  StockMovement,
  ActivityLog,
  AIResponse,
  Product,
} from '../types';

export type PurchaseOrderSort = 'newest' | 'oldest' | 'supplier';
export type SalesOrderSort = 'newest' | 'oldest' | 'customer';
export type SupplierSort = 'name' | 'rating' | 'newest';
export type WarehouseSort = 'name' | 'code';

function listParams(
  search?: string,
  sort?: string,
  page = 1,
  pageSize = PAGE_SIZE,
  all = false,
): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page,
    page_size: all ? 0 : pageSize,
  };
  if (search) params.search = search;
  if (sort) params.sort = sort;
  return params;
}

export async function getSuppliers(
  search?: string,
  sort: SupplierSort = 'name',
  page = 1,
  pageSize = PAGE_SIZE,
  all = false,
): Promise<Paginated<Supplier>> {
  const { data } = await apiClient.get<Paginated<Supplier>>('/suppliers', {
    params: listParams(search, sort, page, pageSize, all),
  });
  return data;
}

export const getSupplier = (id: number) => apiClient.get<Supplier>(`/suppliers/${id}`).then((r) => r.data);
export const getSupplierPayments = (supplierId: number) =>
  apiClient.get(`/suppliers/${supplierId}/payments`).then((r) => r.data);
export const createSupplier = (data: Partial<Supplier>) => apiClient.post<Supplier>('/suppliers', data).then((r) => r.data);

export async function getWarehouses(
  search?: string,
  sort: WarehouseSort = 'name',
  page = 1,
  pageSize = PAGE_SIZE,
  all = false,
): Promise<Paginated<Warehouse>> {
  const { data } = await apiClient.get<Paginated<Warehouse>>('/warehouses', {
    params: listParams(search, sort, page, pageSize, all),
  });
  return data;
}

export const getWarehouse = (id: number) => apiClient.get<Warehouse>(`/warehouses/${id}`).then((r) => r.data);
export const getWarehouseLocations = (warehouseId: number) =>
  apiClient.get(`/warehouses/${warehouseId}/locations`).then((r) => r.data);
export const createWarehouse = (data: { name: string; code: string; address?: string }) =>
  apiClient.post<Warehouse>('/warehouses', data).then((r) => r.data);

export async function getPurchaseOrders(
  search?: string,
  sort: PurchaseOrderSort = 'newest',
  page = 1,
  pageSize = PAGE_SIZE,
  all = false,
): Promise<Paginated<PurchaseOrder>> {
  const { data } = await apiClient.get<Paginated<PurchaseOrder>>('/purchases', {
    params: listParams(search, sort, page, pageSize, all),
  });
  return data;
}

export const getPurchaseOrder = (id: number) => apiClient.get<PurchaseOrder>(`/purchases/${id}`).then((r) => r.data);
export const approvePurchaseOrder = (id: number) => apiClient.post<PurchaseOrder>(`/purchases/${id}/approve`).then((r) => r.data);
export const receivePurchaseOrder = (id: number) => apiClient.post<PurchaseOrder>(`/purchases/${id}/receive`).then((r) => r.data);

export const getCustomers = () => apiClient.get<Customer[]>('/sales/customers').then((r) => r.data);

export async function getSalesOrders(
  search?: string,
  sort: SalesOrderSort = 'newest',
  page = 1,
  pageSize = PAGE_SIZE,
  all = false,
): Promise<Paginated<SalesOrder>> {
  const { data } = await apiClient.get<Paginated<SalesOrder>>('/sales/orders', {
    params: listParams(search, sort, page, pageSize, all),
  });
  return data;
}

export const getSalesOrder = (id: number) => apiClient.get<SalesOrder>(`/sales/orders/${id}`).then((r) => r.data);
export const fulfillSalesOrder = (id: number) => apiClient.post<SalesOrder>(`/sales/orders/${id}/fulfill`).then((r) => r.data);

export const getProduct = (id: number) => apiClient.get<Product>(`/products/${id}`).then((r) => r.data);
export const getProductVariants = (productId: number) =>
  apiClient.get(`/products/${productId}/variants`).then((r) => r.data);

export const getStockMovements = (productId?: number) =>
  apiClient.get<StockMovement[]>('/inventory/movements', { params: { product_id: productId } }).then((r) => r.data);

export const getActivityLogs = () => apiClient.get<ActivityLog[]>('/audits/activity-logs').then((r) => r.data);

export const askAI = (question: string) =>
  apiClient.post<AIResponse>('/ai/ask', { question }).then((r) => r.data);

export const getForecasts = () => apiClient.get('/ai/forecast').then((r) => r.data);
