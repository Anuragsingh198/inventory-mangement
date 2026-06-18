from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, Field

from app.schemas.enums import TransferStatus


class WarehouseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    code: str = Field(min_length=1, max_length=20)
    address: str | None = None


class WarehouseUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    is_active: bool | None = None


class WarehouseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    code: str
    address: str | None = None
    is_active: bool
    created_at: datetime


class WarehouseLocationCreate(BaseModel):
    warehouse_id: int
    rack: str | None = None
    shelf: str | None = None
    bin: str | None = None
    label: str


class WarehouseLocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    warehouse_id: int
    rack: str | None = None
    shelf: str | None = None
    bin: str | None = None
    label: str


class WarehouseTransferCreate(BaseModel):
    from_warehouse_id: int
    to_warehouse_id: int
    product_id: int
    quantity: int = Field(gt=0)
    notes: str | None = None


class WarehouseTransferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    from_warehouse_id: int
    to_warehouse_id: int
    product_id: int
    quantity: int
    status: TransferStatus
    notes: str | None = None
    created_at: datetime
    completed_at: datetime | None = None
