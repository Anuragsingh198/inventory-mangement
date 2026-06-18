from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import InvoiceStatus, SalesOrderStatus
from app.schemas.product import ProductResponse


class CustomerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    notes: str | None = None


class CustomerUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    notes: str | None = None


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    notes: str | None = None
    created_at: datetime


class SalesOrderLineCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(gt=0)


class SalesOrderLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    quantity: int
    fulfilled_quantity: int
    unit_price: Decimal
    product: ProductResponse | None = None


class SalesOrderCreate(BaseModel):
    customer_id: int
    warehouse_id: int | None = None
    notes: str | None = None
    items: list[SalesOrderLineCreate] = Field(min_length=1)


class SalesOrderUpdate(BaseModel):
    status: SalesOrderStatus | None = None
    notes: str | None = None


class SalesOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    customer_id: int
    warehouse_id: int | None = None
    status: SalesOrderStatus
    notes: str | None = None
    created_at: datetime
    fulfilled_at: datetime | None = None
    customer: CustomerResponse | None = None
    items: list[SalesOrderLineResponse] = []


class CustomerInvoiceCreate(BaseModel):
    customer_id: int
    sales_order_id: int | None = None
    invoice_number: str
    amount: Decimal = Field(gt=0)
    due_date: datetime | None = None


class CustomerInvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    customer_id: int
    sales_order_id: int | None = None
    invoice_number: str
    amount: Decimal
    status: InvoiceStatus
    due_date: datetime | None = None
    created_at: datetime
