from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_permission
from app.database import get_db
from app.models import StockMovementType, TransferStatus, User, Warehouse, WarehouseLocation, WarehouseTransfer
from app.schemas import (
    WarehouseCreate,
    WarehouseLocationCreate,
    WarehouseLocationResponse,
    WarehouseResponse,
    WarehouseTransferCreate,
    WarehouseTransferResponse,
)
from app.services.audit_service import log_activity
from app.services.stock_movement_service import StockMovementService

router = APIRouter(prefix="/warehouses", tags=["warehouses"])


@router.get("", response_model=list[WarehouseResponse])
def list_warehouses(db: Session = Depends(get_db), _: User = Depends(require_permission("warehouses.read"))):
    return db.query(Warehouse).order_by(Warehouse.name).all()


@router.post("", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
def create_warehouse(
    payload: WarehouseCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("warehouses.create")),
):
    if db.query(Warehouse).filter(Warehouse.code == payload.code).first():
        raise HTTPException(status_code=400, detail="Warehouse code exists")
    wh = Warehouse(**payload.model_dump())
    db.add(wh)
    log_activity(db, user=user, action="create", entity_type="warehouse", entity_id=None)
    db.commit()
    db.refresh(wh)
    return wh


@router.get("/transfers", response_model=list[WarehouseTransferResponse])
def list_transfers(db: Session = Depends(get_db), _: User = Depends(require_permission("transfers.read"))):
    return db.query(WarehouseTransfer).order_by(WarehouseTransfer.created_at.desc()).limit(100).all()


@router.post("/transfers", response_model=WarehouseTransferResponse, status_code=status.HTTP_201_CREATED)
def create_transfer(
    payload: WarehouseTransferCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("transfers.create")),
):
    if payload.from_warehouse_id == payload.to_warehouse_id:
        raise HTTPException(status_code=400, detail="Source and destination must differ")
    transfer = WarehouseTransfer(**payload.model_dump(), created_by=user.id)
    db.add(transfer)
    db.flush()
    try:
        StockMovementService.record(
            db, product_id=payload.product_id, warehouse_id=payload.from_warehouse_id,
            quantity_delta=-payload.quantity, movement_type=StockMovementType.TRANSFER_OUT,
            reason=f"Transfer #{transfer.id}", reference_type="warehouse_transfer", reference_id=transfer.id, user=user,
        )
        StockMovementService.record(
            db, product_id=payload.product_id, warehouse_id=payload.to_warehouse_id,
            quantity_delta=payload.quantity, movement_type=StockMovementType.TRANSFER_IN,
            reason=f"Transfer #{transfer.id}", reference_type="warehouse_transfer", reference_id=transfer.id, user=user,
        )
    except ValueError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc))
    transfer.status = TransferStatus.COMPLETED
    transfer.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(transfer)
    return transfer


@router.post("/locations", response_model=WarehouseLocationResponse, status_code=status.HTTP_201_CREATED)
def create_location(
    payload: WarehouseLocationCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("warehouses.create")),
):
    loc = WarehouseLocation(**payload.model_dump())
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc


@router.get("/{warehouse_id}", response_model=WarehouseResponse)
def get_warehouse(
    warehouse_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("warehouses.read")),
):
    wh = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not wh:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    return wh


@router.get("/{warehouse_id}/locations", response_model=list[WarehouseLocationResponse])
def list_locations(
    warehouse_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("warehouses.read")),
):
    return db.query(WarehouseLocation).filter(WarehouseLocation.warehouse_id == warehouse_id).all()
