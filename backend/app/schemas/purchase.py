from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import InvoiceStatus, PurchaseOrderStatus
from app.schemas.product import ProductResponse
from app.schemas.supplier import SupplierResponse


class PurchaseOrderLineCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(gt=0)


class PurchaseOrderLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    quantity: int
    received_quantity: int
    unit_price: Decimal
    product: ProductResponse | None = None


class PurchaseOrderCreate(BaseModel):
    supplier_id: int
    warehouse_id: int | None = None
    notes: str | None = None
    items: list[PurchaseOrderLineCreate] = Field(min_length=1)


class PurchaseOrderUpdate(BaseModel):
    status: PurchaseOrderStatus | None = None
    notes: str | None = None


class PurchaseOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    supplier_id: int
    warehouse_id: int | None = None
    status: PurchaseOrderStatus
    notes: str | None = None
    created_at: datetime
    approved_at: datetime | None = None
    received_at: datetime | None = None
    supplier: SupplierResponse | None = None
    items: list[PurchaseOrderLineResponse] = []


class VendorInvoiceCreate(BaseModel):
    supplier_id: int
    purchase_order_id: int | None = None
    invoice_number: str
    amount: Decimal = Field(gt=0)
    due_date: datetime | None = None
    file_url: str | None = None


class VendorInvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    supplier_id: int
    purchase_order_id: int | None = None
    invoice_number: str
    amount: Decimal
    status: InvoiceStatus
    due_date: datetime | None = None
    created_at: datetime
