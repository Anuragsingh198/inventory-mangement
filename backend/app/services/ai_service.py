from sqlalchemy.orm import Session, joinedload

from app.models import InventoryBalance, Product, StockMovement
from app.services.forecast_service import dead_stock_analysis, forecast_all, forecast_product, near_expiry_batches
from app.services.stock_movement_service import StockMovementService


INTENTS = {
    "run_out": ["run out", "stockout", "out of stock next"],
    "dead_stock": ["dead stock", "slow moving", "not selling"],
    "forecast": ["predict", "forecast", "demand", "next month"],
    "reorder": ["reorder", "restock", "purchase suggestion"],
    "expiry": ["expiry", "expire", "near expiry"],
}


def _detect_intent(question: str) -> str:
    q = question.lower()
    for intent, keywords in INTENTS.items():
        if any(k in q for k in keywords):
            return intent
    return "general"


def ask_inventory_assistant(db: Session, question: str) -> dict:
    intent = _detect_intent(question)
    answer_parts: list[str] = []
    data: dict = {"intent": intent}

    if intent == "run_out":
        forecasts = forecast_all(db, limit=50)
        at_risk = [f for f in forecasts if f.get("days_until_stockout") is not None and f["days_until_stockout"] <= 7]
        data["at_risk"] = at_risk[:10]
        if at_risk:
            answer_parts.append("Products likely to run out within 7 days:")
            for item in at_risk[:5]:
                answer_parts.append(
                    f"- {item['product_name']} ({item['sku']}): {item['current_stock']} units, "
                    f"~{item['days_until_stockout']} days left"
                )
        else:
            answer_parts.append("No products are projected to run out within the next 7 days.")

    elif intent == "dead_stock":
        dead = dead_stock_analysis(db)[:10]
        data["dead_stock"] = dead
        if dead:
            answer_parts.append("Dead/slow-moving stock items:")
            for item in dead[:5]:
                answer_parts.append(f"- {item['name']} ({item['sku']}): {item['quantity']} units, value ${item['value']:.2f}")
        else:
            answer_parts.append("No significant dead stock detected in the last 90 days.")

    elif intent in ("forecast", "reorder"):
        forecasts = forecast_all(db, limit=20)
        reorder = [f for f in forecasts if f.get("reorder_suggested")]
        data["reorder_suggestions"] = reorder[:10]
        if reorder:
            answer_parts.append("Reorder recommendations based on 30-day moving average:")
            for item in reorder[:5]:
                answer_parts.append(
                    f"- {item['product_name']}: order ~{item['recommended_reorder_qty']} units "
                    f"(current: {item['current_stock']})"
                )
        else:
            answer_parts.append("Stock levels appear adequate for the next 30 days.")

    elif intent == "expiry":
        batches = near_expiry_batches(db)
        data["near_expiry"] = batches
        if batches:
            answer_parts.append("Batches nearing expiry:")
            for b in batches[:5]:
                answer_parts.append(f"- Lot {b['lot_number']}: {b['quantity']} units, expires {b['expiry_date']}")
        else:
            answer_parts.append("No batches expiring within 30 days.")

    else:
        low = (
            db.query(InventoryBalance)
            .options(joinedload(InventoryBalance.product))
            .filter(InventoryBalance.quantity < InventoryBalance.min_threshold)
            .limit(5)
            .all()
        )
        data["low_stock"] = [{"product": b.product.name if b.product else "", "qty": b.quantity} for b in low]
        answer_parts.append(
            "I can help with: stockout predictions, dead stock, demand forecasts, reorder suggestions, and expiry alerts. "
            "Try asking: 'Which products will run out next week?'"
        )

    return {"question": question, "answer": "\n".join(answer_parts), "data": data}


def extract_invoice_ocr_stub(filename: str, content_hint: str = "") -> dict:
    """Stub OCR — returns structured template for manual review."""
    return {
        "filename": filename,
        "status": "review_required",
        "message": "OCR extraction ready for review. Connect a vision API for full automation.",
        "extracted_lines": [
            {"description": "Sample item from invoice", "quantity": 1, "unit_price": 0.0},
        ],
        "raw_hint": content_hint[:500] if content_hint else None,
    }
