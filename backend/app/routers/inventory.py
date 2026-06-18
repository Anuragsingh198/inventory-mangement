from datetime import datetime, timezone
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import String, cast, or_
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user, require_permission
from app.database import get_db
from app.models import Category, Inventory, Product, StockMovementType, User
from app.schemas import (
    InventoryAdjust,
    InventoryCreate,
    InventoryResponse,
    InventoryUpdate,
    MessageResponse,
    StockMovementResponse,
)
from app.services.audit_service import log_activity
from app.services.stock_movement_service import StockMovementService, get_or_create_default_warehouse
from app.services.alert_service import check_and_create_stock_alert
from app.schemas.common import PaginatedResponse
from app.utils.pagination import paginate_query, total_pages

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("", response_model=PaginatedResponse[InventoryResponse])
def list_inventory(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("inventory.read"))],
    search: str | None = Query(default=None),
    sort: Literal["id", "name", "sku", "quantity", "location"] = Query(default="id"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=0, le=500),
):
    query = (
        db.query(Inventory)
        .options(joinedload(Inventory.product).joinedload(Product.category))
    )
    if search:
        term = search.strip()
        if term:
            pattern = f"%{term}%"
            query = (
                query.join(Inventory.product)
                .outerjoin(Product.category)
                .filter(
                    or_(
                        Product.name.ilike(pattern),
                        Product.sku.ilike(pattern),
                        Inventory.location.ilike(pattern),
                        cast(Inventory.id, String).ilike(pattern),
                        cast(Inventory.product_id, String).ilike(pattern),
                        cast(Inventory.quantity, String).ilike(pattern),
                        cast(Inventory.min_threshold, String).ilike(pattern),
                        Category.name.ilike(pattern),
                    )
                )
            )
    joined_product = bool(search and search.strip())
    if joined_product:
        query = query.join(Inventory.product)
    if sort in {"name", "sku"} and not joined_product:
        query = query.join(Inventory.product)
    if sort == "name":
        query = query.order_by(Product.name)
    elif sort == "sku":
        query = query.order_by(Product.sku)
    elif sort == "quantity":
        query = query.order_by(Inventory.quantity.desc())
    elif sort == "location":
        query = query.order_by(Inventory.location)
    else:
        query = query.order_by(Inventory.id)

    items, total = paginate_query(query, page, page_size)
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size if page_size > 0 else total,
        pages=total_pages(total, page_size),
    )


@router.get("/movements", response_model=list[StockMovementResponse])
def list_movements(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("stock_movements.read"))],
    product_id: int | None = None,
    warehouse_id: int | None = None,
    limit: int = 100,
):
    return StockMovementService.list_movements(db, product_id=product_id, warehouse_id=warehouse_id, limit=limit)


@router.get("/low-stock", response_model=list[InventoryResponse])
def get_low_stock(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("inventory.read"))],
):
    return (
        db.query(Inventory)
        .options(joinedload(Inventory.product).joinedload(Product.category))
        .filter(Inventory.quantity < Inventory.min_threshold)
        .order_by(Inventory.quantity)
        .all()
    )


@router.get("/{inventory_id}", response_model=InventoryResponse)
def get_inventory_item(
    inventory_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("inventory.read"))],
):
    item = (
        db.query(Inventory)
        .options(joinedload(Inventory.product).joinedload(Product.category))
        .filter(Inventory.id == inventory_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item


@router.post("", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def create_inventory(
    inventory_in: InventoryCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("inventory.adjust"))],
):
    existing = db.query(Inventory).filter(Inventory.product_id == inventory_in.product_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Inventory already exists for this product")

    warehouse = get_or_create_default_warehouse(db)
    wh_id = inventory_in.warehouse_id or warehouse.id

    if inventory_in.quantity > 0:
        StockMovementService.record(
            db,
            product_id=inventory_in.product_id,
            warehouse_id=wh_id,
            quantity_delta=inventory_in.quantity,
            movement_type=StockMovementType.ADJUSTMENT,
            reason="Initial stock",
            user=current_user,
        )

    item = db.query(Inventory).filter(Inventory.product_id == inventory_in.product_id).first()
    if item:
        item.min_threshold = inventory_in.min_threshold
        item.location = inventory_in.location
        item.last_updated = datetime.now(timezone.utc)
        check_and_create_stock_alert(db, item)

    log_activity(db, user=current_user, action="create", entity_type="inventory", entity_id=item.id if item else None)
    db.commit()

    item = (
        db.query(Inventory)
        .options(joinedload(Inventory.product).joinedload(Product.category))
        .filter(Inventory.product_id == inventory_in.product_id)
        .first()
    )
    return item


@router.patch("/{inventory_id}", response_model=InventoryResponse)
def update_inventory(
    inventory_id: int,
    inventory_in: InventoryUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("inventory.adjust"))],
):
    item = (
        db.query(Inventory)
        .options(joinedload(Inventory.product))
        .filter(Inventory.id == inventory_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    data = inventory_in.model_dump(exclude_unset=True)
    qty_change = None
    if "quantity" in data:
        qty_change = data.pop("quantity") - item.quantity

    for field, value in data.items():
        setattr(item, field, value)

    if qty_change and qty_change != 0:
        StockMovementService.adjust(
            db, product_id=item.product_id, adjustment=qty_change,
            reason="Manual quantity update", user=current_user,
        )
        item = db.query(Inventory).filter(Inventory.id == inventory_id).first()

    item.last_updated = datetime.now(timezone.utc)
    check_and_create_stock_alert(db, item)
    log_activity(db, user=current_user, action="update", entity_type="inventory", entity_id=inventory_id)
    db.commit()

    item = (
        db.query(Inventory)
        .options(joinedload(Inventory.product).joinedload(Product.category))
        .filter(Inventory.id == inventory_id)
        .first()
    )
    return item


@router.post("/{inventory_id}/adjust", response_model=InventoryResponse)
def adjust_inventory(
    inventory_id: int,
    adjustment_in: InventoryAdjust,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("inventory.adjust"))],
):
    item = (
        db.query(Inventory)
        .options(joinedload(Inventory.product))
        .filter(Inventory.id == inventory_id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    movement_type = StockMovementType.ADJUSTMENT
    if adjustment_in.movement_type:
        try:
            movement_type = StockMovementType(adjustment_in.movement_type)
        except ValueError:
            pass

    try:
        StockMovementService.record(
            db,
            product_id=item.product_id,
            warehouse_id=adjustment_in.warehouse_id,
            quantity_delta=adjustment_in.adjustment,
            movement_type=movement_type,
            reason=adjustment_in.reason,
            user=current_user,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    item = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    log_activity(db, user=current_user, action="adjust", entity_type="inventory", entity_id=inventory_id,
                 details={"adjustment": adjustment_in.adjustment, "reason": adjustment_in.reason})
    db.commit()

    item = (
        db.query(Inventory)
        .options(joinedload(Inventory.product).joinedload(Product.category))
        .filter(Inventory.id == inventory_id)
        .first()
    )
    return item


@router.delete("/{inventory_id}", response_model=MessageResponse)
def delete_inventory(
    inventory_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("inventory.adjust"))],
):
    item = db.query(Inventory).filter(Inventory.id == inventory_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    db.delete(item)
    log_activity(db, user=current_user, action="delete", entity_type="inventory", entity_id=inventory_id)
    db.commit()
    return MessageResponse(message="Inventory item deleted")
