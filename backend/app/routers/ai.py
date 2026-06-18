from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.core.deps import require_permission
from app.database import get_db
from app.models import User
from app.schemas import AIQuestionRequest, AIQuestionResponse, ForecastResponse
from app.services.ai_service import ask_inventory_assistant, extract_invoice_ocr_stub
from app.services.forecast_service import dead_stock_analysis, forecast_all, forecast_product, near_expiry_batches, seasonal_trends

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/ask", response_model=AIQuestionResponse)
def ask_assistant(payload: AIQuestionRequest, db: Session = Depends(get_db), _: User = Depends(require_permission("ai.read"))):
    result = ask_inventory_assistant(db, payload.question)
    return AIQuestionResponse(**result)


@router.get("/forecast", response_model=list[ForecastResponse])
def get_forecasts(db: Session = Depends(get_db), _: User = Depends(require_permission("ai.read"))):
    return forecast_all(db)


@router.get("/forecast/{product_id}", response_model=ForecastResponse)
def get_product_forecast(product_id: int, db: Session = Depends(get_db), _: User = Depends(require_permission("ai.read"))):
    return forecast_product(db, product_id)


@router.get("/dead-stock")
def get_dead_stock(db: Session = Depends(get_db), _: User = Depends(require_permission("ai.read"))):
    return dead_stock_analysis(db)


@router.get("/near-expiry")
def get_near_expiry(db: Session = Depends(get_db), _: User = Depends(require_permission("ai.read"))):
    return near_expiry_batches(db)


@router.get("/seasonal-trends")
def get_seasonal_trends(db: Session = Depends(get_db), _: User = Depends(require_permission("ai.read"))):
    return seasonal_trends(db)


@router.post("/invoice-ocr")
async def invoice_ocr(file: UploadFile = File(...), _: User = Depends(require_permission("purchases.create"))):
    content = (await file.read()).decode("utf-8", errors="ignore")
    return extract_invoice_ocr_stub(file.filename or "invoice", content)
