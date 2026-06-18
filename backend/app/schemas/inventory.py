from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.product import ProductResponse


class InventoryBase(BaseModel):
    product_id: int
    quantity: int = Field(ge=0)
    min_threshold: int = Field(ge=0, default=10)
    location: str | None = None


class InventoryCreate(InventoryBase):
    warehouse_id: int | None = None


class InventoryUpdate(BaseModel):
    quantity: int | None = Field(default=None, ge=0)
    min_threshold: int | None = Field(default=None, ge=0)
    location: str | None = None


class InventoryAdjust(BaseModel):
    adjustment: int
    reason: str = Field(min_length=1)
    warehouse_id: int | None = None
    movement_type: str | None = None


class InventoryResponse(InventoryBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    last_updated: datetime
    product: ProductResponse | None = None


class InventoryBalanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    warehouse_id: int
    location_id: int | None = None
    quantity: int
    reserved_quantity: int
    min_threshold: int
    available_quantity: int = 0
    last_updated: datetime
    product: ProductResponse | None = None


class StockMovementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    warehouse_id: int
    quantity_delta: int
    movement_type: str
    reference_type: str | None = None
    reference_id: int | None = None
    reason: str | None = None
    user_id: int | None = None
    created_at: datetime
