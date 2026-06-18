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

export const getSuppliers = () => apiClient.get<Supplier[]>('/suppliers').then((r) => r.data);
export const getSupplier = (id: number) => apiClient.get<Supplier>(`/suppliers/${id}`).then((r) => r.data);
export const getSupplierPayments = (supplierId: number) =>
  apiClient.get(`/suppliers/${supplierId}/payments`).then((r) => r.data);
export const createSupplier = (data: Partial<Supplier>) => apiClient.post<Supplier>('/suppliers', data).then((r) => r.data);

export const getWarehouses = () => apiClient.get<Warehouse[]>('/warehouses').then((r) => r.data);
export const getWarehouse = (id: number) => apiClient.get<Warehouse>(`/warehouses/${id}`).then((r) => r.data);
export const getWarehouseLocations = (warehouseId: number) =>
  apiClient.get(`/warehouses/${warehouseId}/locations`).then((r) => r.data);
export const createWarehouse = (data: { name: string; code: string; address?: string }) =>
  apiClient.post<Warehouse>('/warehouses', data).then((r) => r.data);

export const getPurchaseOrders = () => apiClient.get<PurchaseOrder[]>('/purchases').then((r) => r.data);
export const getPurchaseOrder = (id: number) => apiClient.get<PurchaseOrder>(`/purchases/${id}`).then((r) => r.data);
export const approvePurchaseOrder = (id: number) => apiClient.post<PurchaseOrder>(`/purchases/${id}/approve`).then((r) => r.data);
export const receivePurchaseOrder = (id: number) => apiClient.post<PurchaseOrder>(`/purchases/${id}/receive`).then((r) => r.data);

export const getCustomers = () => apiClient.get<Customer[]>('/sales/customers').then((r) => r.data);
export const getSalesOrders = () => apiClient.get<SalesOrder[]>('/sales/orders').then((r) => r.data);
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
