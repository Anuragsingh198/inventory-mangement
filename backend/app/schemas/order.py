from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import OrderStatus
from app.schemas.product import ProductResponse


class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_price: Decimal = Field(gt=0)


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(OrderItemBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product: ProductResponse | None = None


class OrderBase(BaseModel):
    supplier: str = Field(min_length=1, max_length=200)
    notes: str | None = None


class OrderCreate(OrderBase):
    items: list[OrderItemCreate] = Field(min_length=1)


class OrderUpdate(BaseModel):
    supplier: str | None = Field(default=None, min_length=1, max_length=200)
    status: OrderStatus | None = None
    notes: str | None = None


class OrderResponse(OrderBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: OrderStatus
    created_at: datetime
    items: list[OrderItemResponse] = []
