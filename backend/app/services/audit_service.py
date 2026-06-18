import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models import ActivityLog, User


def log_activity(
    db: Session,
    *,
    user: User | None,
    action: str,
    entity_type: str,
    entity_id: int | None = None,
    details: dict | str | None = None,
    ip_address: str | None = None,
) -> ActivityLog:
    details_str = json.dumps(details) if isinstance(details, dict) else details
    entry = ActivityLog(
        user_id=user.id if user else None,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details_str,
        ip_address=ip_address,
        created_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    return entry
