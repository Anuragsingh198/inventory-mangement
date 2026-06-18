from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.deps import get_current_user
from app.database import get_db
from app.models import Product, StockAlert, User
from app.schemas import MessageResponse, StockAlertResponse

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[StockAlertResponse])
def list_alerts(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
    unread_only: bool = True,
):
    query = (
        db.query(StockAlert)
        .options(joinedload(StockAlert.product).joinedload(Product.category))
        .order_by(StockAlert.created_at.desc())
    )
    if unread_only:
        query = query.filter(StockAlert.is_read.is_(False))
    return query.all()


@router.patch("/{alert_id}/read", response_model=StockAlertResponse)
def mark_alert_read(
    alert_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    alert = (
        db.query(StockAlert)
        .options(joinedload(StockAlert.product).joinedload(Product.category))
        .filter(StockAlert.id == alert_id)
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{alert_id}", response_model=MessageResponse)
def delete_alert(
    alert_id: int,
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
):
    alert = db.query(StockAlert).filter(StockAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return MessageResponse(message="Alert deleted")
