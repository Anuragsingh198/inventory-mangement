from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import require_permission
from app.database import get_db
from app.models import User
from app.services.notification_service import send_email_via_resend, _admin_emails

router = APIRouter(prefix="/notifications", tags=["notifications"])


class EmailConfigResponse(BaseModel):
    configured: bool
    from_email: str
    recipients: list[str]
    provider: str = "resend"


class TestEmailRequest(BaseModel):
    to: str | None = None


class TestEmailResponse(BaseModel):
    ok: bool
    to: str
    error: str | None = None


@router.get("/email-config", response_model=EmailConfigResponse)
def email_config(db: Session = Depends(get_db), _: User = Depends(require_permission("alerts.read"))):
    return EmailConfigResponse(
        configured=bool(settings.RESEND_API_KEY),
        from_email=settings.RESEND_FROM_EMAIL,
        recipients=_admin_emails(db),
    )


@router.post("/test-email", response_model=TestEmailResponse)
def test_email(
    payload: TestEmailRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("alerts.read")),
):
    if not settings.RESEND_API_KEY:
        raise HTTPException(status_code=503, detail="RESEND_API_KEY not configured in backend/.env")

    recipients = _admin_emails(db)
    to = payload.to or (recipients[0] if recipients else user.email)
    if not to:
        raise HTTPException(status_code=400, detail="No recipient email available")

    ok, err = send_email_via_resend(
        to=to,
        subject=f"[{settings.APP_NAME}] Test email",
        html=f"<p>This is a test alert email from {settings.APP_NAME}. If you received this, Resend is configured correctly.</p>",
    )
    if not ok:
        raise HTTPException(status_code=502, detail=err or "Failed to send email")

    return TestEmailResponse(ok=True, to=to)
