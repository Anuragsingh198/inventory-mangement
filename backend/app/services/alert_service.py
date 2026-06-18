from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import AlertType, Inventory, StockAlert
from app.services.notification_service import notify_low_stock


def check_and_create_stock_alert(db: Session, inventory: Inventory) -> StockAlert | None:
    product = inventory.product
    if product is None:
        return None

    existing_unread = (
        db.query(StockAlert)
        .filter(
            StockAlert.product_id == inventory.product_id,
            StockAlert.is_read.is_(False),
            StockAlert.alert_type.in_(
                [AlertType.LOW_STOCK, AlertType.OUT_OF_STOCK, AlertType.CRITICAL_STOCK]
            ),
        )
        .first()
    )

    critical_threshold = max(1, inventory.min_threshold // 3)

    if inventory.quantity <= 0:
        alert_type = AlertType.OUT_OF_STOCK
        message = f"{product.name} is out of stock"
    elif inventory.quantity <= critical_threshold:
        alert_type = AlertType.CRITICAL_STOCK
        message = (
            f"{product.name} is critically low ({inventory.quantity} remaining, "
            f"critical threshold: {critical_threshold})"
        )
    elif inventory.quantity < inventory.min_threshold:
        alert_type = AlertType.LOW_STOCK
        message = (
            f"{product.name} stock is low ({inventory.quantity} remaining, "
            f"threshold: {inventory.min_threshold})"
        )
    else:
        if existing_unread:
            existing_unread.is_read = True
        return None

    if existing_unread and existing_unread.alert_type == alert_type:
        existing_unread.message = message
        return existing_unread

    if existing_unread:
        existing_unread.is_read = True

    alert = StockAlert(
        product_id=inventory.product_id,
        alert_type=alert_type,
        message=message,
        is_read=False,
        created_at=datetime.now(timezone.utc),
    )
    db.add(alert)
    db.flush()
    alert.product = product
    notify_low_stock(db, alert)
    return alert
