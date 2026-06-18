import httpx
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import (
    NotificationChannel,
    NotificationDelivery,
    NotificationStatus,
    StockAlert,
    User,
    UserRole,
)
from app.core.permissions import normalize_role


def _admin_emails(db: Session) -> list[str]:
    configured = settings.alert_email_recipients_list
    if configured:
        return configured
    admins = (
        db.query(User)
        .filter(User.is_active.is_(True), User.role.in_([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.INVENTORY_MANAGER]))
        .all()
    )
    return [u.email for u in admins if u.email]


def send_email_via_resend(*, to: str, subject: str, html: str) -> tuple[bool, str | None]:
    if not settings.RESEND_API_KEY:
        return False, "RESEND_API_KEY not configured"

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {settings.RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": settings.RESEND_FROM_EMAIL,
                "to": [to],
                "subject": subject,
                "html": html,
            },
            timeout=15.0,
        )
        if response.status_code in (200, 201):
            return True, None
        return False, response.text
    except Exception as exc:
        return False, str(exc)


def dispatch_alert_email(db: Session, alert: StockAlert) -> list[NotificationDelivery]:
    recipients = _admin_emails(db)
    if not recipients:
        return []

    product_name = alert.product.name if alert.product else f"Product #{alert.product_id}"
    subject = f"[{settings.APP_NAME}] {alert.alert_type.value.replace('_', ' ').title()}: {product_name}"
    html = f"""
    <div style="font-family:sans-serif;max-width:560px">
      <h2 style="color:#1e3a5f">{settings.APP_NAME} Alert</h2>
      <p><strong>{alert.message}</strong></p>
      <p style="color:#666">Type: {alert.alert_type.value}</p>
      <p style="color:#666">Time: {alert.created_at.isoformat()}</p>
    </div>
    """

    deliveries: list[NotificationDelivery] = []
    for email in recipients:
        existing = (
            db.query(NotificationDelivery)
            .filter(
                NotificationDelivery.alert_id == alert.id,
                NotificationDelivery.channel == NotificationChannel.EMAIL,
                NotificationDelivery.recipient == email,
                NotificationDelivery.status == NotificationStatus.SENT,
            )
            .first()
        )
        if existing:
            continue

        delivery = NotificationDelivery(
            alert_id=alert.id,
            channel=NotificationChannel.EMAIL,
            status=NotificationStatus.PENDING,
            recipient=email,
            subject=subject,
        )
        db.add(delivery)
        db.flush()

        ok, err = send_email_via_resend(to=email, subject=subject, html=html)
        delivery.status = NotificationStatus.SENT if ok else NotificationStatus.FAILED
        delivery.error_message = err
        delivery.sent_at = datetime.now(timezone.utc) if ok else None
        deliveries.append(delivery)

    return deliveries


def notify_low_stock(db: Session, alert: StockAlert) -> None:
    dispatch_alert_email(db, alert)
