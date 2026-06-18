"""Extended schemas — re-exports legacy + new domain schemas."""

from app.schemas.common import MessageResponse, Token, TokenData
from app.schemas.auth import UserCreate, UserLogin, UserResponse, GoogleAuthRequest
from app.schemas.product import (
    CategoryBase, CategoryCreate, CategoryUpdate, CategoryResponse,
    ProductBase, ProductCreate, ProductUpdate, ProductResponse,
    ProductVariantCreate, ProductVariantResponse,
)
from app.schemas.inventory import (
    InventoryBase, InventoryCreate, InventoryUpdate, InventoryAdjust, InventoryResponse,
    InventoryBalanceResponse, StockMovementResponse,
)
from app.schemas.order import (
    OrderItemBase, OrderItemCreate, OrderItemResponse,
    OrderBase, OrderCreate, OrderUpdate, OrderResponse,
)
from app.schemas.alert import StockAlertResponse
from app.schemas.report import ReportSummary
from app.schemas.warehouse import (
    WarehouseCreate, WarehouseUpdate, WarehouseResponse,
    WarehouseLocationCreate, WarehouseLocationResponse,
    WarehouseTransferCreate, WarehouseTransferResponse,
)
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierResponse, SupplierPaymentCreate, SupplierPaymentResponse
from app.schemas.purchase import (
    PurchaseOrderCreate, PurchaseOrderUpdate, PurchaseOrderResponse,
    PurchaseOrderLineCreate, VendorInvoiceCreate, VendorInvoiceResponse,
)
from app.schemas.sales import (
    CustomerCreate, CustomerUpdate, CustomerResponse,
    SalesOrderCreate, SalesOrderUpdate, SalesOrderResponse,
    CustomerInvoiceCreate, CustomerInvoiceResponse,
)
from app.schemas.batch import BatchCreate, BatchResponse, SerialNumberCreate, SerialNumberResponse
from app.schemas.audit import (
    InventoryAuditCreate, InventoryAuditUpdate, InventoryAuditResponse,
    InventoryAuditLineCreate, InventoryAuditLineResponse, ActivityLogResponse,
)
from app.schemas.ai import AIQuestionRequest, AIQuestionResponse, ForecastResponse, ReorderSuggestion
from app.schemas.enums import (
    UserRole, OrderStatus, AlertType, PurchaseOrderStatus, SalesOrderStatus,
    StockMovementType, AuditStatus, TransferStatus, InvoiceStatus,
)

__all__ = [
    "MessageResponse", "Token", "TokenData",
    "UserCreate", "UserLogin", "UserResponse", "GoogleAuthRequest", "UserRole",
    "CategoryBase", "CategoryCreate", "CategoryUpdate", "CategoryResponse",
    "ProductBase", "ProductCreate", "ProductUpdate", "ProductResponse",
    "ProductVariantCreate", "ProductVariantResponse",
    "InventoryBase", "InventoryCreate", "InventoryUpdate", "InventoryAdjust", "InventoryResponse",
    "InventoryBalanceResponse", "StockMovementResponse",
    "OrderItemBase", "OrderItemCreate", "OrderItemResponse",
    "OrderBase", "OrderCreate", "OrderUpdate", "OrderResponse", "OrderStatus",
    "StockAlertResponse", "AlertType",
    "ReportSummary",
    "WarehouseCreate", "WarehouseUpdate", "WarehouseResponse",
    "WarehouseLocationCreate", "WarehouseLocationResponse",
    "WarehouseTransferCreate", "WarehouseTransferResponse",
    "SupplierCreate", "SupplierUpdate", "SupplierResponse",
    "SupplierPaymentCreate", "SupplierPaymentResponse",
    "PurchaseOrderCreate", "PurchaseOrderUpdate", "PurchaseOrderResponse",
    "PurchaseOrderLineCreate", "VendorInvoiceCreate", "VendorInvoiceResponse", "PurchaseOrderStatus",
    "CustomerCreate", "CustomerUpdate", "CustomerResponse",
    "SalesOrderCreate", "SalesOrderUpdate", "SalesOrderResponse",
    "CustomerInvoiceCreate", "CustomerInvoiceResponse", "SalesOrderStatus",
    "BatchCreate", "BatchResponse", "SerialNumberCreate", "SerialNumberResponse",
    "InventoryAuditCreate", "InventoryAuditUpdate", "InventoryAuditResponse",
    "InventoryAuditLineCreate", "InventoryAuditLineResponse", "ActivityLogResponse", "AuditStatus",
    "AIQuestionRequest", "AIQuestionResponse", "ForecastResponse", "ReorderSuggestion",
    "StockMovementType", "TransferStatus", "InvoiceStatus",
]
