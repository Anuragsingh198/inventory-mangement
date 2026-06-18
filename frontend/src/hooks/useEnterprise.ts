import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';
import { getApiErrorMessage } from '../lib/apiError';
import { PAGE_SIZE } from '../lib/utils';
import type { ListQueryOptions } from '../types';
import {
  approvePurchaseOrder,
  askAI,
  createSupplier,
  createWarehouse,
  fulfillSalesOrder,
  getActivityLogs,
  getCustomers,
  getForecasts,
  getProduct,
  getProductVariants,
  getPurchaseOrder,
  getPurchaseOrders,
  getSalesOrder,
  getSalesOrders,
  getStockMovements,
  getSupplier,
  getSupplierPayments,
  getSuppliers,
  getWarehouse,
  getWarehouseLocations,
  getWarehouses,
  receivePurchaseOrder,
  type PurchaseOrderSort,
  type SalesOrderSort,
  type SupplierSort,
  type WarehouseSort,
} from '../api/enterprise';

export function useSuppliers(search?: string, sort: SupplierSort = 'name', options: ListQueryOptions = {}) {
  const page = options.page ?? 1;
  const pageSize = options.all ? 0 : (options.pageSize ?? PAGE_SIZE);

  return useQuery({
    queryKey: ['suppliers', search, sort, options.all ? 'all' : page, pageSize],
    queryFn: () => getSuppliers(search, sort, page, pageSize, options.all),
    placeholderData: keepPreviousData,
  });
}

export function useSupplier(id: number) {
  return useQuery({ queryKey: ['suppliers', id], queryFn: () => getSupplier(id), enabled: id > 0 });
}

export function useSupplierPayments(supplierId: number) {
  return useQuery({
    queryKey: ['supplier-payments', supplierId],
    queryFn: () => getSupplierPayments(supplierId),
    enabled: supplierId > 0,
  });
}

export function useWarehouses(search?: string, sort: WarehouseSort = 'name', options: ListQueryOptions = {}) {
  const page = options.page ?? 1;
  const pageSize = options.all ? 0 : (options.pageSize ?? PAGE_SIZE);

  return useQuery({
    queryKey: ['warehouses', search, sort, options.all ? 'all' : page, pageSize],
    queryFn: () => getWarehouses(search, sort, page, pageSize, options.all),
    placeholderData: keepPreviousData,
  });
}

export function useWarehouse(id: number) {
  return useQuery({ queryKey: ['warehouses', id], queryFn: () => getWarehouse(id), enabled: id > 0 });
}

export function useWarehouseLocations(warehouseId: number) {
  return useQuery({
    queryKey: ['warehouse-locations', warehouseId],
    queryFn: () => getWarehouseLocations(warehouseId),
    enabled: warehouseId > 0,
  });
}

export function usePurchaseOrders(search?: string, sort: PurchaseOrderSort = 'newest', options: ListQueryOptions = {}) {
  const page = options.page ?? 1;
  const pageSize = options.all ? 0 : (options.pageSize ?? PAGE_SIZE);

  return useQuery({
    queryKey: ['purchase-orders', search, sort, options.all ? 'all' : page, pageSize],
    queryFn: () => getPurchaseOrders(search, sort, page, pageSize, options.all),
    placeholderData: keepPreviousData,
  });
}

export function usePurchaseOrder(id: number) {
  return useQuery({ queryKey: ['purchase-orders', id], queryFn: () => getPurchaseOrder(id), enabled: id > 0 });
}

export function useSalesOrders(search?: string, sort: SalesOrderSort = 'newest', options: ListQueryOptions = {}) {
  const page = options.page ?? 1;
  const pageSize = options.all ? 0 : (options.pageSize ?? PAGE_SIZE);

  return useQuery({
    queryKey: ['sales-orders', search, sort, options.all ? 'all' : page, pageSize],
    queryFn: () => getSalesOrders(search, sort, page, pageSize, options.all),
    placeholderData: keepPreviousData,
  });
}

export function useSalesOrder(id: number) {
  return useQuery({ queryKey: ['sales-orders', id], queryFn: () => getSalesOrder(id), enabled: id > 0 });
}

export function useCustomers() {
  return useQuery({ queryKey: ['customers'], queryFn: getCustomers });
}

export function useProductDetail(id: number) {
  return useQuery({ queryKey: ['products', id], queryFn: () => getProduct(id), enabled: id > 0 });
}

export function useProductVariants(productId: number) {
  return useQuery({
    queryKey: ['product-variants', productId],
    queryFn: () => getProductVariants(productId),
    enabled: productId > 0,
  });
}

export function useStockMovements(productId?: number) {
  return useQuery({ queryKey: ['stock-movements', productId], queryFn: () => getStockMovements(productId) });
}

export function useActivityLogs() {
  return useQuery({ queryKey: ['activity-logs'], queryFn: getActivityLogs });
}

export function useForecasts() {
  return useQuery({ queryKey: ['forecasts'], queryFn: getForecasts });
}

export function useEnterpriseMutations() {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const invalidate = (...keys: string[]) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  const onActionError = (fallback: string) => (error: unknown) => {
    showToast(getApiErrorMessage(error, fallback), 'error');
  };

  return {
    createSupplier: useMutation({
      mutationFn: createSupplier,
      onSuccess: () => invalidate('suppliers'),
      onError: onActionError('Failed to create supplier'),
    }),
    createWarehouse: useMutation({
      mutationFn: createWarehouse,
      onSuccess: () => invalidate('warehouses'),
      onError: onActionError('Failed to create warehouse'),
    }),
    approvePO: useMutation({
      mutationFn: approvePurchaseOrder,
      onSuccess: (_, id) => {
        invalidate('purchase-orders');
        qc.invalidateQueries({ queryKey: ['purchase-orders', id] });
        invalidate('inventory');
        showToast('Purchase order approved', 'success');
      },
      onError: onActionError('Failed to approve purchase order'),
    }),
    receivePO: useMutation({
      mutationFn: receivePurchaseOrder,
      onSuccess: (_, id) => {
        invalidate('purchase-orders');
        qc.invalidateQueries({ queryKey: ['purchase-orders', id] });
        invalidate('inventory');
        showToast('Stock received into inventory', 'success');
      },
      onError: onActionError('Failed to receive purchase order'),
    }),
    fulfillSO: useMutation({
      mutationFn: fulfillSalesOrder,
      onSuccess: (_, id) => {
        invalidate('sales-orders');
        qc.invalidateQueries({ queryKey: ['sales-orders', id] });
        invalidate('inventory');
        showToast('Sales order fulfilled', 'success');
      },
      onError: onActionError('Failed to fulfill sales order'),
    }),
    askAI: useMutation({ mutationFn: askAI }),
  };
}
