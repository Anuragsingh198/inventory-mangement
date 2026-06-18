from pydantic import BaseModel, Field


class AIQuestionRequest(BaseModel):
    question: str = Field(min_length=3, max_length=500)


class AIQuestionResponse(BaseModel):
    question: str
    answer: str
    data: dict = {}


class ForecastResponse(BaseModel):
    product_id: int
    product_name: str
    sku: str
    current_stock: int
    daily_avg_demand: float
    predicted_demand_30d: float
    days_until_stockout: int | None = None
    reorder_suggested: bool = False
    recommended_reorder_qty: int = 0


class ReorderSuggestion(BaseModel):
    product_id: int
    product_name: str
    recommended_qty: int
    current_stock: int
    supplier_id: int | None = None
