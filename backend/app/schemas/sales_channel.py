from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SalesChannelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    is_active: bool
    created_at: datetime


class SalesChannelSummaryResponse(SalesChannelResponse):
    listings_count: int = 0
    revenue: Decimal = Decimal("0")


class ChannelListingCreate(BaseModel):
    product_id: int = Field(gt=0)
