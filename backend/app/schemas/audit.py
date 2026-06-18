from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import AuditStatus
from app.schemas.product import ProductResponse


class InventoryAuditLineCreate(BaseModel):
    product_id: int
    expected_quantity: int = Field(ge=0)
    counted_quantity: int | None = Field(default=None, ge=0)
    notes: str | None = None


class InventoryAuditLineResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    expected_quantity: int
    counted_quantity: int | None = None
    variance: int | None = None
    notes: str | None = None
    product: ProductResponse | None = None


class InventoryAuditCreate(BaseModel):
    warehouse_id: int
    notes: str | None = None
    lines: list[InventoryAuditLineCreate] = Field(default_factory=list)


class InventoryAuditUpdate(BaseModel):
    status: AuditStatus | None = None
    notes: str | None = None


class InventoryAuditResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    warehouse_id: int
    status: AuditStatus
    notes: str | None = None
    created_at: datetime
    completed_at: datetime | None = None
    lines: list[InventoryAuditLineResponse] = []


class ActivityLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int | None = None
    action: str
    entity_type: str
    entity_id: int | None = None
    details: str | None = None
    ip_address: str | None = None
    created_at: datetime
