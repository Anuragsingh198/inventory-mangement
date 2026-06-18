import enum


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    INVENTORY_MANAGER = "inventory_manager"
    WAREHOUSE_STAFF = "warehouse_staff"
    SALES_EXECUTIVE = "sales_executive"
    ACCOUNTANT = "accountant"
    VIEWER = "viewer"
    ADMIN = "admin"  # legacy alias → super_admin permissions


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    RECEIVED = "received"
    CANCELLED = "cancelled"


class PurchaseOrderStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    PARTIALLY_RECEIVED = "partially_received"
    RECEIVED = "received"
    CANCELLED = "cancelled"


class SalesOrderStatus(str, enum.Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    FULFILLED = "fulfilled"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"


class StockMovementType(str, enum.Enum):
    ADJUSTMENT = "adjustment"
    PURCHASE_RECEIPT = "purchase_receipt"
    SALE_FULFILLMENT = "sale_fulfillment"
    RETURN_IN = "return_in"
    RETURN_OUT = "return_out"
    DAMAGE = "damage"
    TRANSFER_IN = "transfer_in"
    TRANSFER_OUT = "transfer_out"
    AUDIT_VARIANCE = "audit_variance"


class AlertType(str, enum.Enum):
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"
    NEAR_EXPIRY = "near_expiry"
    CRITICAL_STOCK = "critical_stock"
    REORDER = "reorder"


class NotificationChannel(str, enum.Enum):
    IN_APP = "in_app"
    EMAIL = "email"


class NotificationStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class AuditStatus(str, enum.Enum):
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TransferStatus(str, enum.Enum):
    PENDING = "pending"
    IN_TRANSIT = "in_transit"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class SerialStatus(str, enum.Enum):
    AVAILABLE = "available"
    RESERVED = "reserved"
    SOLD = "sold"
    DAMAGED = "damaged"


class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    ISSUED = "issued"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
