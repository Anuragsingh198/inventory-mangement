export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'inventory_manager'
  | 'warehouse_staff'
  | 'sales_executive'
  | 'accountant'
  | 'viewer';

export type OrderStatus = 'pending' | 'received' | 'cancelled';
export type PurchaseOrderStatus = 'draft' | 'pending_approval' | 'approved' | 'partially_received' | 'received' | 'cancelled';
export type SalesOrderStatus = 'draft' | 'confirmed' | 'fulfilled' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type AlertType = 'low_stock' | 'out_of_stock' | 'near_expiry' | 'critical_stock' | 'reorder';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ListQueryOptions {
  page?: number;
  pageSize?: number;
  all?: boolean;
}

export interface User {
  id: number;
  email?: string;
  full_name?: string | null;
  role: UserRole;
  is_active?: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  parent_id?: number | null;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category_id: number;
  price: number;
  cost_price?: number | null;
  description: string | null;
  image_url: string | null;
  barcode?: string | null;
  qr_code?: string | null;
  weight?: number | null;
  created_at: string;
  category?: Category;
}

export interface InventoryItem {
  id: number;
  product_id: number;
  quantity: number;
  min_threshold: number;
  location: string | null;
  last_updated: string;
  product?: Product;
}

export interface StockMovement {
  id: number;
  product_id: number;
  warehouse_id: number;
  quantity_delta: number;
  movement_type: string;
  reason: string | null;
  created_at: string;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  payment_terms: string | null;
  rating: number | null;
  notes: string | null;
  created_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export interface PurchaseOrderLine {
  id: number;
  product_id: number;
  quantity: number;
  received_quantity: number;
  unit_price: number;
  product?: Product;
}

export interface PurchaseOrder {
  id: number;
  supplier_id: number;
  warehouse_id: number | null;
  status: PurchaseOrderStatus;
  notes: string | null;
  created_at: string;
  supplier?: Supplier;
  items: PurchaseOrderLine[];
}

export interface SalesOrderLine {
  id: number;
  product_id: number;
  quantity: number;
  fulfilled_quantity: number;
  unit_price: number;
  product?: Product;
}

export interface SalesOrder {
  id: number;
  customer_id: number;
  warehouse_id: number | null;
  status: SalesOrderStatus;
  notes: string | null;
  created_at: string;
  customer?: Customer;
  items: SalesOrderLine[];
}

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  product?: Product;
}

export interface Order {
  id: number;
  supplier: string;
  status: OrderStatus;
  created_at: string;
  notes: string | null;
  items: OrderItem[];
}

export interface StockAlert {
  id: number;
  product_id: number;
  alert_type: AlertType;
  message: string;
  is_read: boolean;
  created_at: string;
  product?: Product;
}

export interface ReportSummary {
  total_products: number;
  total_stock_value: number;
  pending_orders: number;
  received_orders: number;
  cancelled_orders: number;
  low_stock_count: number;
  top_products_by_stock: { name: string; quantity: number }[];
  pending_purchase_orders?: number;
  pending_sales_orders?: number;
  total_warehouses?: number;
  inventory_turnover_ratio?: number;
}

export interface ActivityLog {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: string | null;
  created_at: string;
}

export interface AIResponse {
  question: string;
  answer: string;
  data: Record<string, unknown>;
}

export interface ProductCreate {
  name: string;
  sku: string;
  category_id: number;
  price: number;
  cost_price?: number;
  description?: string;
  image_url?: string;
  barcode?: string;
}

export interface InventoryAdjust {
  adjustment: number;
  reason: string;
  warehouse_id?: number;
  movement_type?: string;
}

export interface OrderItemCreate {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface OrderCreate {
  supplier: string;
  notes?: string;
  items: OrderItemCreate[];
}

export interface MessageResponse {
  message: string;
}

export const WRITE_ROLES: UserRole[] = ['super_admin', 'admin', 'inventory_manager', 'warehouse_staff', 'sales_executive'];

export function canWrite(role?: UserRole): boolean {
  return !!role && WRITE_ROLES.includes(role);
}

const PO_APPROVE_ROLES: UserRole[] = ['super_admin', 'admin', 'inventory_manager'];
const PO_RECEIVE_ROLES: UserRole[] = ['super_admin', 'admin', 'inventory_manager', 'warehouse_staff'];
const SO_FULFILL_ROLES: UserRole[] = ['super_admin', 'admin', 'warehouse_staff', 'sales_executive'];

export function canApprovePO(role?: UserRole): boolean {
  return !!role && PO_APPROVE_ROLES.includes(role);
}

export function canReceivePO(role?: UserRole): boolean {
  return !!role && PO_RECEIVE_ROLES.includes(role);
}

export function canFulfillSO(role?: UserRole): boolean {
  return !!role && SO_FULFILL_ROLES.includes(role);
}

export function purchaseOrderHasPendingReceipt(po: PurchaseOrder): boolean {
  return po.items.some((line) => line.received_quantity < line.quantity);
}

export function canReceivePurchaseOrder(po: PurchaseOrder): boolean {
  return (
    (po.status === 'approved' || po.status === 'partially_received') &&
    purchaseOrderHasPendingReceipt(po)
  );
}

export function canApprovePurchaseOrder(po: PurchaseOrder): boolean {
  return po.status === 'pending_approval' || po.status === 'draft';
}

export function canFulfillSalesOrder(so: SalesOrder): boolean {
  return so.status === 'confirmed' && so.items.some((line) => line.fulfilled_quantity < line.quantity);
}
