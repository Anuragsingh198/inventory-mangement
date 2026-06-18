import csv
import io
from decimal import Decimal

from sqlalchemy.orm import Session, joinedload

from app.models import Inventory, InventoryBalance, Product, PurchaseOrder, SalesOrder, StockMovement, Supplier


def export_inventory_csv(db: Session) -> str:
    rows = (
        db.query(InventoryBalance)
        .options(joinedload(InventoryBalance.product), joinedload(InventoryBalance.warehouse))
        .order_by(InventoryBalance.id)
        .all()
    )
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        ["product_id", "product_name", "sku", "warehouse", "quantity", "reserved", "available", "min_threshold"]
    )
    for row in rows:
        writer.writerow([
            row.product_id,
            row.product.name if row.product else "",
            row.product.sku if row.product else "",
            row.warehouse.name if row.warehouse else "",
            row.quantity,
            row.reserved_quantity,
            row.available_quantity,
            row.min_threshold,
        ])
    return output.getvalue()


def export_products_csv(db: Session) -> str:
    products = db.query(Product).options(joinedload(Product.category)).order_by(Product.id).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "name", "sku", "category", "price", "cost_price", "barcode", "description"])
    for p in products:
        writer.writerow([
            p.id, p.name, p.sku,
            p.category.name if p.category else "",
            p.price, p.cost_price or "", p.barcode or "", p.description or "",
        ])
    return output.getvalue()


def import_products_csv(db: Session, content: str, category_map: dict[str, int] | None = None) -> dict:
    reader = csv.DictReader(io.StringIO(content))
    created, updated, errors = 0, 0, []
    for i, row in enumerate(reader, start=2):
        try:
            sku = row.get("sku", "").strip()
            name = row.get("name", "").strip()
            if not sku or not name:
                errors.append(f"Row {i}: name and sku required")
                continue
            category_id = int(row["category_id"]) if row.get("category_id") else None
            if not category_id and category_map and row.get("category"):
                category_id = category_map.get(row["category"].strip())
            if not category_id:
                errors.append(f"Row {i}: category_id required")
                continue
            price = Decimal(row.get("price", "0") or "0")
            existing = db.query(Product).filter(Product.sku == sku).first()
            if existing:
                existing.name = name
                existing.price = price
                existing.category_id = category_id
                if row.get("description"):
                    existing.description = row["description"]
                if row.get("barcode"):
                    existing.barcode = row["barcode"]
                updated += 1
            else:
                db.add(Product(
                    name=name, sku=sku, category_id=category_id, price=price,
                    description=row.get("description"), barcode=row.get("barcode") or None,
                ))
                created += 1
        except Exception as exc:
            errors.append(f"Row {i}: {exc}")
    db.commit()
    return {"created": created, "updated": updated, "errors": errors}
