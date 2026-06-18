from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import (
    AlertType,
    Inventory,
    InventoryBalance,
    NotificationChannel,
    NotificationDelivery,
    NotificationStatus,
    Product,
    StockAlert,
    StockMovement,
    StockMovementType,
    User,
    Warehouse,
)
from app.services.alert_service import check_and_create_stock_alert


def get_or_create_default_warehouse(db: Session) -> Warehouse:
    warehouse = db.query(Warehouse).filter(Warehouse.code == settings.DEFAULT_WAREHOUSE_CODE).first()
    if warehouse:
        return warehouse
    warehouse = Warehouse(
        name="Main Warehouse",
        code=settings.DEFAULT_WAREHOUSE_CODE,
        address="Default location",
        is_active=True,
    )
    db.add(warehouse)
    db.flush()
    return warehouse


def get_or_create_balance(
    db: Session, product_id: int, warehouse_id: int, min_threshold: int = 10
) -> InventoryBalance:
    balance = (
        db.query(InventoryBalance)
        .filter(
            InventoryBalance.product_id == product_id,
            InventoryBalance.warehouse_id == warehouse_id,
        )
        .first()
    )
    if balance:
        return balance
    balance = InventoryBalance(
        product_id=product_id,
        warehouse_id=warehouse_id,
        quantity=0,
        reserved_quantity=0,
        min_threshold=min_threshold,
    )
    db.add(balance)
    db.flush()
    return balance


def sync_legacy_inventory(db: Session, product_id: int, warehouse_id: int) -> Inventory | None:
    """Keep legacy inventory table in sync with default warehouse total."""
    balances = (
        db.query(InventoryBalance)
        .filter(InventoryBalance.product_id == product_id)
        .all()
    )
    total_qty = sum(b.quantity for b in balances)
    min_threshold = next((b.min_threshold for b in balances if b.warehouse_id == warehouse_id), 10)

    legacy = db.query(Inventory).filter(Inventory.product_id == product_id).first()
    if legacy:
        legacy.quantity = total_qty
        legacy.min_threshold = min_threshold
        legacy.last_updated = datetime.now(timezone.utc)
    else:
        legacy = Inventory(
            product_id=product_id,
            quantity=total_qty,
            min_threshold=min_threshold,
        )
        db.add(legacy)
        db.flush()

    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        legacy.product = product
        check_and_create_stock_alert(db, legacy)
    return legacy


class StockMovementService:
    @staticmethod
    def record(
        db: Session,
        *,
        product_id: int,
        warehouse_id: int | None,
        quantity_delta: int,
        movement_type: StockMovementType,
        reason: str | None = None,
        reference_type: str | None = None,
        reference_id: int | None = None,
        user: User | None = None,
        batch_id: int | None = None,
        sync_legacy: bool = True,
    ) -> tuple[StockMovement, InventoryBalance]:
        warehouse = (
            db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
            if warehouse_id
            else get_or_create_default_warehouse(db)
        )
        if not warehouse:
            raise ValueError("Warehouse not found")

        balance = get_or_create_balance(db, product_id, warehouse.id)
        new_qty = balance.quantity + quantity_delta
        if new_qty < 0:
            raise ValueError("Insufficient stock")

        balance.quantity = new_qty
        balance.last_updated = datetime.now(timezone.utc)

        movement = StockMovement(
            product_id=product_id,
            warehouse_id=warehouse.id,
            quantity_delta=quantity_delta,
            movement_type=movement_type,
            reference_type=reference_type,
            reference_id=reference_id,
            reason=reason,
            user_id=user.id if user else None,
            batch_id=batch_id,
        )
        db.add(movement)
        db.flush()

        if sync_legacy:
            sync_legacy_inventory(db, product_id, warehouse.id)

        return movement, balance

    @staticmethod
    def adjust(
        db: Session,
        *,
        product_id: int,
        adjustment: int,
        reason: str,
        warehouse_id: int | None = None,
        user: User | None = None,
    ) -> tuple[StockMovement, InventoryBalance]:
        return StockMovementService.record(
            db,
            product_id=product_id,
            warehouse_id=warehouse_id,
            quantity_delta=adjustment,
            movement_type=StockMovementType.ADJUSTMENT,
            reason=reason,
            user=user,
        )

    @staticmethod
    def list_movements(
        db: Session,
        *,
        product_id: int | None = None,
        warehouse_id: int | None = None,
        limit: int = 100,
    ) -> list[StockMovement]:
        query = db.query(StockMovement).order_by(StockMovement.created_at.desc())
        if product_id:
            query = query.filter(StockMovement.product_id == product_id)
        if warehouse_id:
            query = query.filter(StockMovement.warehouse_id == warehouse_id)
        return query.limit(limit).all()
