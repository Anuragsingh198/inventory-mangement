from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models import (
    Inventory,
    Order,
    OrderStatus,
    Product,
    PurchaseOrder,
    PurchaseOrderStatus,
    SalesOrder,
    SalesOrderStatus,
    StockMovement,
    StockMovementType,
    Warehouse,
)
from app.schemas import ReportSummary


def get_report_summary(db: Session) -> ReportSummary:
    total_products = db.query(func.count(Product.id)).scalar() or 0

    stock_value_result = (
        db.query(func.coalesce(func.sum(Product.price * Inventory.quantity), 0))
        .join(Inventory, Inventory.product_id == Product.id)
        .scalar()
    )
    total_stock_value = Decimal(str(stock_value_result or 0))

    pending_orders = db.query(func.count(Order.id)).filter(Order.status == OrderStatus.PENDING).scalar() or 0
    received_orders = db.query(func.count(Order.id)).filter(Order.status == OrderStatus.RECEIVED).scalar() or 0
    cancelled_orders = db.query(func.count(Order.id)).filter(Order.status == OrderStatus.CANCELLED).scalar() or 0

    pending_po = (
        db.query(func.count(PurchaseOrder.id))
        .filter(PurchaseOrder.status.in_([PurchaseOrderStatus.PENDING_APPROVAL, PurchaseOrderStatus.APPROVED]))
        .scalar()
        or 0
    )
    pending_so = (
        db.query(func.count(SalesOrder.id))
        .filter(SalesOrder.status.in_([SalesOrderStatus.CONFIRMED, SalesOrderStatus.DRAFT]))
        .scalar()
        or 0
    )

    low_stock_count = (
        db.query(func.count(Inventory.id)).filter(Inventory.quantity < Inventory.min_threshold).scalar() or 0
    )

    total_warehouses = db.query(func.count(Warehouse.id)).scalar() or 0

    sold_30d = (
        db.query(func.coalesce(func.sum(StockMovement.quantity_delta * -1), 0))
        .filter(StockMovement.movement_type == StockMovementType.SALE_FULFILLMENT)
        .scalar()
        or 0
    )
    avg_inventory = db.query(func.coalesce(func.avg(Inventory.quantity), 0)).scalar() or 1
    turnover = float(sold_30d) / max(float(avg_inventory), 1)

    top_products = (
        db.query(Product.name, Inventory.quantity)
        .join(Inventory, Inventory.product_id == Product.id)
        .order_by(Inventory.quantity.desc())
        .limit(10)
        .all()
    )

    return ReportSummary(
        total_products=total_products,
        total_stock_value=total_stock_value,
        pending_orders=pending_orders,
        received_orders=received_orders,
        cancelled_orders=cancelled_orders,
        low_stock_count=low_stock_count,
        top_products_by_stock=[{"name": name, "quantity": quantity} for name, quantity in top_products],
        pending_purchase_orders=pending_po,
        pending_sales_orders=pending_so,
        total_warehouses=total_warehouses,
        inventory_turnover_ratio=round(turnover, 2),
    )


def get_inventory_export_rows(db: Session) -> list[dict]:
    rows = db.query(Inventory).options(joinedload(Inventory.product).joinedload(Product.category)).all()
    return [
        {
            "product_id": inv.product_id,
            "product_name": inv.product.name if inv.product else "",
            "sku": inv.product.sku if inv.product else "",
            "category": inv.product.category.name if inv.product and inv.product.category else "",
            "quantity": inv.quantity,
            "min_threshold": inv.min_threshold,
            "location": inv.location or "",
            "barcode": inv.product.barcode if inv.product else "",
            "unit_price": float(inv.product.price) if inv.product else 0,
            "stock_value": float(inv.product.price * inv.quantity) if inv.product else 0,
            "last_updated": inv.last_updated.isoformat() if inv.last_updated else "",
        }
        for inv in rows
    ]
