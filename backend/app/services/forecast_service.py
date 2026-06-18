from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Batch, InventoryBalance, Product, SalesOrderLine, StockMovement, StockMovementType


def moving_average_demand(db: Session, product_id: int, days: int = 30) -> float:
    since = date.today() - timedelta(days=days)
    total = (
        db.query(func.coalesce(func.sum(StockMovement.quantity_delta * -1), 0))
        .filter(
            StockMovement.product_id == product_id,
            StockMovement.movement_type == StockMovementType.SALE_FULFILLMENT,
            func.date(StockMovement.created_at) >= since,
        )
        .scalar()
    )
    return max(0, float(total or 0)) / max(days, 1)


def forecast_product(db: Session, product_id: int, horizon_days: int = 30) -> dict:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return {}
    daily_avg = moving_average_demand(db, product_id)
    balance = (
        db.query(InventoryBalance)
        .filter(InventoryBalance.product_id == product_id)
        .all()
    )
    current_stock = sum(b.quantity for b in balance)
    predicted_demand = daily_avg * horizon_days
    days_until_stockout = int(current_stock / daily_avg) if daily_avg > 0 else None
    return {
        "product_id": product_id,
        "product_name": product.name,
        "sku": product.sku,
        "current_stock": current_stock,
        "daily_avg_demand": round(daily_avg, 2),
        "predicted_demand_30d": round(predicted_demand, 2),
        "days_until_stockout": days_until_stockout,
        "reorder_suggested": current_stock < predicted_demand,
        "recommended_reorder_qty": max(0, int(predicted_demand - current_stock)),
    }


def forecast_all(db: Session, limit: int = 20) -> list[dict]:
    products = db.query(Product).limit(limit).all()
    results = [forecast_product(db, p.id) for p in products]
    return sorted(results, key=lambda x: x.get("days_until_stockout") or 9999)


def seasonal_trends(db: Session) -> list[dict]:
    rows = (
        db.query(
            func.date_trunc("month", StockMovement.created_at).label("month"),
            func.sum(StockMovement.quantity_delta * -1).label("units"),
        )
        .filter(StockMovement.movement_type == StockMovementType.SALE_FULFILLMENT)
        .group_by("month")
        .order_by("month")
        .limit(12)
        .all()
    )
    return [{"month": str(r.month.date()) if r.month else None, "units_sold": int(r.units or 0)} for r in rows]


def dead_stock_analysis(db: Session, days: int = 90) -> list[dict]:
    cutoff = date.today() - timedelta(days=days)
    products = db.query(Product).all()
    dead = []
    for p in products:
        last_move = (
            db.query(StockMovement)
            .filter(StockMovement.product_id == p.id)
            .order_by(StockMovement.created_at.desc())
            .first()
        )
        balances = db.query(InventoryBalance).filter(InventoryBalance.product_id == p.id).all()
        qty = sum(b.quantity for b in balances)
        if qty <= 0:
            continue
        last_date = last_move.created_at.date() if last_move else None
        if last_date is None or last_date < cutoff:
            dead.append({
                "product_id": p.id,
                "name": p.name,
                "sku": p.sku,
                "quantity": qty,
                "last_movement": str(last_date) if last_date else None,
                "value": float(p.price) * qty,
            })
    return sorted(dead, key=lambda x: x["value"], reverse=True)


def near_expiry_batches(db: Session, days: int = 30) -> list[dict]:
    cutoff = date.today() + timedelta(days=days)
    batches = (
        db.query(Batch)
        .filter(Batch.expiry_date.isnot(None), Batch.expiry_date <= cutoff, Batch.quantity > 0)
        .all()
    )
    return [
        {
            "batch_id": b.id,
            "lot_number": b.lot_number,
            "product_id": b.product_id,
            "quantity": b.quantity,
            "expiry_date": str(b.expiry_date),
        }
        for b in batches
    ]
