from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_permission
from app.database import get_db
from app.models import User
from app.schemas import MessageResponse
from app.schemas.sales_channel import ChannelListingCreate, SalesChannelSummaryResponse
from app.services.audit_service import log_activity
from app.services.sales_channel_service import (
    connect_product_to_channel,
    disconnect_product_from_channel,
    get_channel_summaries,
)

router = APIRouter(prefix="/sales-channels", tags=["sales-channels"])


@router.get("", response_model=list[SalesChannelSummaryResponse])
def list_sales_channels(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(require_permission("sales_channels.read"))],
):
    return get_channel_summaries(db)


@router.post("/{channel_id}/listings", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def connect_listing(
    channel_id: int,
    payload: ChannelListingCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("sales_channels.manage"))],
):
    try:
        listing = connect_product_to_channel(db, channel_id, payload.product_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    log_activity(
        db,
        user=current_user,
        action="connect",
        entity_type="sales_channel_listing",
        entity_id=listing.id,
        details={"channel_id": channel_id, "product_id": payload.product_id},
    )
    db.commit()
    return MessageResponse(message="Product connected to sales channel")


@router.delete("/{channel_id}/listings/{product_id}", response_model=MessageResponse)
def disconnect_listing(
    channel_id: int,
    product_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_permission("sales_channels.manage"))],
):
    try:
        disconnect_product_from_channel(db, channel_id, product_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    log_activity(
        db,
        user=current_user,
        action="disconnect",
        entity_type="sales_channel_listing",
        entity_id=None,
        details={"channel_id": channel_id, "product_id": product_id},
    )
    db.commit()
    return MessageResponse(message="Product removed from sales channel")
