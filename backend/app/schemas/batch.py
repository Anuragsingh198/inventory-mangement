from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.enums import SerialStatus


class BatchCreate(BaseModel):
    product_id: int
    lot_number: str
    quantity: int = Field(ge=0, default=0)
    expiry_date: date | None = None
    manufacturing_date: date | None = None
    warehouse_id: int | None = None


class BatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    lot_number: str
    quantity: int
    expiry_date: date | None = None
    manufacturing_date: date | None = None
    warehouse_id: int | None = None
    created_at: datetime


class SerialNumberCreate(BaseModel):
    product_id: int
    serial: str
    batch_id: int | None = None
    warehouse_id: int | None = None


class SerialNumberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    serial: str
    status: SerialStatus
    batch_id: int | None = None
    warehouse_id: int | None = None
    created_at: datetime
