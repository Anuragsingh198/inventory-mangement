import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ActivityLogsPage } from './pages/ActivityLogs';
import { GuidePage } from './pages/Guide';
import { DashboardPage } from './pages/Dashboard';
import { InventoryPage } from './pages/Inventory';
import { ListingsPage } from './pages/Listings';
import { LoginPage } from './pages/Login';
import { NotificationsPage } from './pages/Notifications';
import { OrderDetailPage } from './pages/OrderDetail';
import { OrdersPage } from './pages/Orders';
import { PaymentsPage } from './pages/Payments';
import { ProductDetailPage } from './pages/ProductDetail';
import { PurchaseOrderDetailPage } from './pages/PurchaseOrderDetail';
import { PurchasesPage } from './pages/Purchases';
import { ReportsPage } from './pages/Reports';
import { SalesChannelsPage } from './pages/SalesChannels';
import { SalesOrderDetailPage } from './pages/SalesOrderDetail';
import { SalesOrdersPage } from './pages/SalesOrders';
import { ShipmentsPage } from './pages/Shipments';
import { SupplierDetailPage } from './pages/SupplierDetail';
import { SuppliersPage } from './pages/Suppliers';
import { WarehouseDetailPage } from './pages/WarehouseDetail';
import { WarehousesPage } from './pages/Warehouses';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="guide" element={<GuidePage />} />
        <Route path="listings" element={<ListingsPage />} />
        <Route path="listings/:id" element={<ProductDetailPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="warehouses" element={<WarehousesPage />} />
        <Route path="warehouses/:id" element={<WarehouseDetailPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="suppliers/:id" element={<SupplierDetailPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="purchases/:id" element={<PurchaseOrderDetailPage />} />
        <Route path="sales" element={<SalesOrdersPage />} />
        <Route path="sales/:id" element={<SalesOrderDetailPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="shipments" element={<ShipmentsPage />} />
        <Route path="sales-channels" element={<SalesChannelsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="ai-assistant" element={<Navigate to="/dashboard" replace />} />
        <Route path="activity-logs" element={<ActivityLogsPage />} />
        <Route path="products" element={<Navigate to="/listings" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
