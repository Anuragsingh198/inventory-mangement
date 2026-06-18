import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
} from '../api/enterprise';

export function useSuppliers() {
  return useQuery({ queryKey: ['suppliers'], queryFn: getSuppliers });
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

export function useWarehouses() {
  return useQuery({ queryKey: ['warehouses'], queryFn: getWarehouses });
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

export function usePurchaseOrders() {
  return useQuery({ queryKey: ['purchase-orders'], queryFn: getPurchaseOrders });
}

export function usePurchaseOrder(id: number) {
  return useQuery({ queryKey: ['purchase-orders', id], queryFn: () => getPurchaseOrder(id), enabled: id > 0 });
}

export function useSalesOrders() {
  return useQuery({ queryKey: ['sales-orders'], queryFn: getSalesOrders });
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
  const invalidate = (...keys: string[]) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));

  return {
    createSupplier: useMutation({
      mutationFn: createSupplier,
      onSuccess: () => invalidate('suppliers'),
    }),
    createWarehouse: useMutation({
      mutationFn: createWarehouse,
      onSuccess: () => invalidate('warehouses'),
    }),
    approvePO: useMutation({
      mutationFn: approvePurchaseOrder,
      onSuccess: (_, id) => {
        invalidate('purchase-orders');
        qc.invalidateQueries({ queryKey: ['purchase-orders', id] });
        invalidate('inventory');
      },
    }),
    receivePO: useMutation({
      mutationFn: receivePurchaseOrder,
      onSuccess: (_, id) => {
        invalidate('purchase-orders');
        qc.invalidateQueries({ queryKey: ['purchase-orders', id] });
        invalidate('inventory');
      },
    }),
    fulfillSO: useMutation({
      mutationFn: fulfillSalesOrder,
      onSuccess: (_, id) => {
        invalidate('sales-orders');
        qc.invalidateQueries({ queryKey: ['sales-orders', id] });
        invalidate('inventory');
      },
    }),
    askAI: useMutation({ mutationFn: askAI }),
  };
}
