from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.enums import AlertType
from app.schemas.product import ProductResponse


class StockAlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    alert_type: AlertType
    message: str
    is_read: bool
    created_at: datetime
    product: ProductResponse | None = None
