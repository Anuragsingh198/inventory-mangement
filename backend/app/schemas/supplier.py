from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SupplierCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    contact_name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    payment_terms: str | None = None
    notes: str | None = None


class SupplierUpdate(BaseModel):
    name: str | None = None
    contact_name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    payment_terms: str | None = None
    rating: Decimal | None = None
    notes: str | None = None


class SupplierResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    contact_name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    payment_terms: str | None = None
    rating: Decimal | None = None
    notes: str | None = None
    created_at: datetime


class SupplierPaymentCreate(BaseModel):
    supplier_id: int
    amount: Decimal = Field(gt=0)
    reference: str | None = None
    notes: str | None = None


class SupplierPaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    supplier_id: int
    amount: Decimal
    reference: str | None = None
    notes: str | None = None
    paid_at: datetime | None = None
    created_at: datetime
